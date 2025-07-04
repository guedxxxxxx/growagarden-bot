require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

const GUEDX_ID = '955969285686181898';
const LTC_ADDRESS = 'ltc1qr3lqtfc4em5mkfjrhjuh838nnhnpswpfxtqsu8';

const userTickets = new Map();
const userOrders = new Map();
const userItems = new Map();
const userEmbeds = new Map();

function calculateDollarAmount(amount) {
  return amount.toFixed(2);
}

function getRobuxLink(product, displayName) {
  const robuxLinks = {
    'raccoon': 'http://www.roblox.com/game-pass/1030721475/1000',
    'queen_bee': 'https://www.roblox.com/game-pass/1037487540/500',
    'disco_bee': 'https://www.roblox.com/game-pass/1041552295/1200',
    'dragonfly': 'https://www.roblox.com/game-pass/1044850980/750'
  };
  const link = robuxLinks[product] || 'https://www.roblox.com';
  return `[Click here to buy the gamepass for ${displayName}](${link})`;
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content === '!growagarden') {
    const button = new ButtonBuilder()
      .setCustomId('open_menu')
      .setLabel('🛍️ Open the Pet Shop')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await message.channel.send({
      content: `🌻 **WELCOME TO THE ULTIMATE GROW A GARDEN PET SHOP!** 🐝🌿

🎉 **Ready to transform your garden into the ultimate flex?**  
🐾 Adopt amazing pets that boost your grinding power and show off your style!

💰 **Pricing & Payment Options:**
- Choose your pets and see prices instantly.
- Pay with **Litecoin (LTC)** or **Robux** via Game Passes.

👉 **Smash the button below to start picking your pets and grow your garden empire!**`,
      components: [row]
    });
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.isButton() && interaction.customId === 'open_menu') {
    const menu = new StringSelectMenuBuilder()
      .setCustomId('category_select')
      .setPlaceholder('Choose a category')
      .addOptions([{ label: 'Pets', value: 'pets', emoji: '🌿' }]);

    const row = new ActionRowBuilder().addComponents(menu);
    await interaction.reply({ content: 'Select a category below:', components: [row], ephemeral: true });
  }

  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    const channel = interaction.channel;

    await interaction.reply({ content: '✅ Ticket will be closed.', ephemeral: true });

    userTickets.forEach((chId, userId) => {
      if (chId === channel.id) {
        userTickets.delete(userId);
        userOrders.delete(userId);
        userItems.delete(userId);
        userEmbeds.delete(userId);
      }
    });

    await channel.delete();
  }

  if (interaction.isButton() && interaction.customId === 'copy_ltc') {
    await interaction.reply({
      content: `Click to copy:\n\`${LTC_ADDRESS}\``,
      ephemeral: true
    });
  }

  if (interaction.isStringSelectMenu()) {
    const selectedId = interaction.customId;

    if (selectedId === 'category_select') {
      const pets = [
        { label: 'Raccoon', price: 3, emoji: '🦝' },
        { label: 'Queen Bee', price: 2, emoji: '🐝' },
        { label: 'Disco Bee', price: 5, emoji: '🪩' },
        { label: 'Dragonfly', price: 2.5, emoji: '🐉' }
      ];

      const menu = new StringSelectMenuBuilder()
        .setCustomId('product_select')
        .setPlaceholder('Choose a pet')
        .addOptions(
          pets.map(p => ({
            label: `${p.label}`,
            value: p.label.toLowerCase().replace(/ /g, '_'),
            emoji: p.emoji
          }))
        );

      const row = new ActionRowBuilder().addComponents(menu);
      await interaction.update({ content: 'Select a pet below:', components: [row] });
    }

    if (selectedId === 'product_select') {
      const pets = [
        { label: 'Raccoon', price: 3, emoji: '🦝' },
        { label: 'Queen Bee', price: 2, emoji: '🐝' },
        { label: 'Disco Bee', price: 5, emoji: '🪩' },
        { label: 'Dragonfly', price: 2.5, emoji: '🐉' }
      ];

      const user = interaction.user;
      const guild = interaction.guild;
      const selectedProduct = interaction.values[0];
      const displayName = selectedProduct.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      const productInfo = pets.find(p => p.label.toLowerCase().replace(/ /g, '_') === selectedProduct);
      const price = productInfo.price;
      const robuxPrice = { 'raccoon': 1000, 'queen_bee': 500, 'disco_bee': 1200, 'dragonfly': 750 }[selectedProduct];
      const productEntry = { name: displayName, emoji: productInfo.emoji, price, robuxPrice };
      const prevList = userItems.get(user.id) || [];
      const newList = [...prevList, productEntry];
      userItems.set(user.id, newList);

      const total = newList.reduce((sum, item) => sum + item.price, 0);
      userOrders.set(user.id, total);

      const usd = calculateDollarAmount(total);
      const totalRobux = newList.reduce((sum, item) => sum + item.robuxPrice, 0);

      const robuxLinks = newList.map(item =>
        `🔸 **${item.name}:** ${getRobuxLink(item.name.toLowerCase().replace(/ /g, '_'), item.name)}`
      ).join('\n');

      const productListText = newList.map(p => `${p.emoji} ${p.name} = $${p.price} / ${p.robuxPrice} Robux`).join('\n');

      const embed = {
        title: '🛒 Order Summary',
        description: `${productListText}\n\n📦 **Total:** $${usd} / ${totalRobux} Robux\n\n⚠️ **If you're buying more than one of the same pet, make sure to purchase each pass separately, delete your order, and buy again.**`,
        color: 0x00b0f4
      };

      const paymentEmbed = {
        title: '💳 Payment Information',
        description: `
⚠️ **Please wait for support to arrive before making the payment!**

**Payment methods below**
🔸 **For LTC:** \`${LTC_ADDRESS}\`

**For Robux (Game Passes):**
${robuxLinks}

🔸 **Coin:** Litecoin (LTC)  
🔸 **Network:** LTC Mainnet  
💬 **Support will be here in 1–2 minutes to assist you.`,
        color: 0xffd700,
        thumbnail: { url: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png' }
      };

      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger);

      const copyLTCButton = new ButtonBuilder()
        .setCustomId('copy_ltc')
        .setLabel('Copy LTC Address')
        .setStyle(ButtonStyle.Secondary);

      const buttonsRow = new ActionRowBuilder().addComponents(closeButton, copyLTCButton);

      const existingChannelId = userTickets.get(user.id);
      const existingChannel = existingChannelId ? guild.channels.cache.get(existingChannelId) : null;

      if (existingChannel) {
        const embedMsgId = userEmbeds.get(user.id);
        const embedMsg = await existingChannel.messages.fetch(embedMsgId);

        await embedMsg.edit({ embeds: [embed, paymentEmbed], components: [buttonsRow] });
        await interaction.update({ content: '✅ Pet added to your order!', components: [] });
      } else {
        const channel = await guild.channels.create({
          name: `ticket-${user.username}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            { id: GUEDX_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
          ]
        });

        const message = await channel.send({
          content: `<@${GUEDX_ID}>`,
          embeds: [embed, paymentEmbed],
          components: [buttonsRow]
        });

        userTickets.set(user.id, channel.id);
        userEmbeds.set(user.id, message.id);

        await interaction.update({ content: '✅ Ticket created and pet added!', components: [] });
      }

      const moreMenu = new StringSelectMenuBuilder()
        .setCustomId('additional_purchase')
        .setPlaceholder('Anything else?')
        .addOptions([
          { label: 'Yes', value: 'yes', emoji: '🌼' },
          { label: 'No', value: 'no', emoji: '❌' }
        ]);
      const moreRow = new ActionRowBuilder().addComponents(moreMenu);
      await interaction.followUp({ content: 'Do you want to add anything else?', components: [moreRow], ephemeral: true });
    }

    if (selectedId === 'additional_purchase') {
      const choice = interaction.values[0];
      if (choice === 'no') {
        await interaction.update({ content: '✅ Your ticket has been successfully created!', components: [] });
      } else {
        const menu = new StringSelectMenuBuilder()
          .setCustomId('category_select')
          .setPlaceholder('Choose a category')
          .addOptions([{ label: 'Pets', value: 'pets', emoji: '🌿' }]);

        const row = new ActionRowBuilder().addComponents(menu);
        await interaction.update({ content: 'Select a category below:', components: [row] });
      }
    }
  }
});

client.login(process.env.TOKEN);
