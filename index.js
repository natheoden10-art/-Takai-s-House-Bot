const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelType, 
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

// Configuration du bot
const PREFIX = '+';
const TOKEN = process.env.DISCORD_TOKEN; // Token depuis les variables d'environnement Railway

// Création du client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Map pour stocker les informations des tickets
const ticketData = new Map();

// Événement : Bot prêt
client.once('ready', () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
    console.log(`🤖 Préfixe des commandes : ${PREFIX}`);
    
    // Définir le statut du bot
    client.user.setPresence({
        activities: [{ name: `${PREFIX}help | Tickets disponibles` }],
        status: 'online'
    });
});

// Événement : Réception d'un message
client.on('messageCreate', async (message) => {
    // Ignorer les messages des bots et ceux sans préfixe
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    // Extraction de la commande et des arguments
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    try {
        // === COMMANDES BASIQUES ===
        
        // Commande ping
        if (command === 'ping') {
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🏓 Pong !')
                .setDescription(`Latence : \`${client.ws.ping}ms\``)
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
        }

        // Commande help
        else if (command === 'help') {
            const embed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle('📋 Liste des commandes')
                .addFields(
                    {
                        name: '🔧 Commandes basiques',
                        value: `\`${PREFIX}ping\` - Affiche la latence\n\`${PREFIX}help\` - Affiche cette aide\n\`${PREFIX}ticket\` - Créer un panel de tickets`,
                        inline: false
                    },
                    {
                        name: '👮 Commandes admin',
                        value: `\`${PREFIX}kick @user [raison]\` - Expulser un membre\n\`${PREFIX}ban @user [raison]\` - Bannir un membre\n\`${PREFIX}clear <nombre>\` - Supprimer des messages`,
                        inline: false
                    },
                    {
                        name: '🎫 Commandes tickets',
                        value: `\`${PREFIX}lock\` - Verrouiller le ticket\n\`${PREFIX}unlock\` - Déverrouiller le ticket\n\`${PREFIX}add @user\` - Ajouter un membre au ticket\n\`${PREFIX}rename <nom>\` - Renommer le salon`,
                        inline: false
                    }
                )
                .setFooter({ text: `Préfixe : ${PREFIX}` })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        }

        // Commande ticket (créer le panel)
        else if (command === 'ticket') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return message.reply('❌ Vous n\'avez pas la permission de créer un panel de tickets.');
            }

            const embed = new EmbedBuilder()
                .setColor('#9932CC')
                .setTitle('🎫 Support Tickets')
                .setDescription('Cliquez sur le bouton ci-dessous pour ouvrir un ticket de support.\n\n**Rappel :** N\'ouvrez un ticket que si vous avez vraiment besoin d\'aide.')
                .setFooter({ text: 'Système de tickets' })
                .setTimestamp();

            const button = new ButtonBuilder()
                .setCustomId('open_ticket')
                .setLabel('Ouvrir un ticket')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎫');

            const row = new ActionRowBuilder().addComponents(button);

            await message.channel.send({ embeds: [embed], components: [row] });
            await message.delete();
        }

        // === COMMANDES ADMIN ===
        
        // Commande kick
        else if (command === 'kick') {
            if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
                return message.reply('❌ Vous n\'avez pas la permission d\'expulser des membres.');
            }

            const user = message.mentions.users.first();
            if (!user) {
                return message.reply('❌ Veuillez mentionner un utilisateur à expulser.');
            }

            const member = message.guild.members.cache.get(user.id);
            if (!member) {
                return message.reply('❌ Utilisateur introuvable sur ce serveur.');
            }

            if (!member.kickable) {
                return message.reply('❌ Je ne peux pas expulser cet utilisateur.');
            }

            const reason = args.slice(1).join(' ') || 'Aucune raison fournie';

            try {
                await member.kick(reason);
                
                const embed = new EmbedBuilder()
                    .setColor('#FF6600')
                    .setTitle('👢 Membre expulsé')
                    .addFields(
                        { name: 'Utilisateur', value: `${user.tag}`, inline: true },
                        { name: 'Modérateur', value: `${message.author.tag}`, inline: true },
                        { name: 'Raison', value: reason, inline: false }
                    )
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
            } catch (error) {
                console.error(error);
                await message.reply('❌ Erreur lors de l\'expulsion.');
            }
        }

        // Commande ban
        else if (command === 'ban') {
            if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                return message.reply('❌ Vous n\'avez pas la permission de bannir des membres.');
            }

            const user = message.mentions.users.first();
            if (!user) {
                return message.reply('❌ Veuillez mentionner un utilisateur à bannir.');
            }

            const member = message.guild.members.cache.get(user.id);
            if (member && !member.bannable) {
                return message.reply('❌ Je ne peux pas bannir cet utilisateur.');
            }

            const reason = args.slice(1).join(' ') || 'Aucune raison fournie';

            try {
                await message.guild.members.ban(user, { reason });
                
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🔨 Membre banni')
                    .addFields(
                        { name: 'Utilisateur', value: `${user.tag}`, inline: true },
                        { name: 'Modérateur', value: `${message.author.tag}`, inline: true },
                        { name: 'Raison', value: reason, inline: false }
                    )
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
            } catch (error) {
                console.error(error);
                await message.reply('❌ Erreur lors du bannissement.');
            }
        }

        // Commande clear
        else if (command === 'clear') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return message.reply('❌ Vous n\'avez pas la permission de supprimer des messages.');
            }

            const amount = parseInt(args[0]);
            if (!amount || amount < 1 || amount > 100) {
                return message.reply('❌ Veuillez fournir un nombre entre 1 et 100.');
            }

            try {
                const messages = await message.channel.bulkDelete(amount + 1, true);
                
                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setDescription(`🧹 ${messages.size - 1} messages supprimés par ${message.author}`)
                    .setTimestamp();

                const reply = await message.channel.send({ embeds: [embed] });
                setTimeout(() => reply.delete(), 3000);
            } catch (error) {
                console.error(error);
                await message.reply('❌ Erreur lors de la suppression des messages.');
            }
        }

        // === COMMANDES TICKETS ===
        
        // Commande lock (verrouiller le ticket)
        else if (command === 'lock') {
            if (!ticketData.has(message.channel.id)) {
                return message.reply('❌ Cette commande ne peut être utilisée que dans un ticket.');
            }

            if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return message.reply('❌ Vous n\'avez pas la permission de verrouiller ce ticket.');
            }

            try {
                await message.channel.permissionOverwrites.edit(ticketData.get(message.channel.id).userId, {
                    SendMessages: false
                });

                const embed = new EmbedBuilder()
                    .setColor('#FF6600')
                    .setDescription(`🔒 Ticket verrouillé par ${message.author}`)
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
            } catch (error) {
                console.error(error);
                await message.reply('❌ Erreur lors du verrouillage du ticket.');
            }
        }

        // Commande unlock (déverrouiller le ticket)
        else if (command === 'unlock') {
            if (!ticketData.has(message.channel.id)) {
                return message.reply('❌ Cette commande ne peut être utilisée que dans un ticket.');
            }

            if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return message.reply('❌ Vous n\'avez pas la permission de déverrouiller ce ticket.');
            }

            try {
                await message.channel.permissionOverwrites.edit(ticketData.get(message.channel.id).userId, {
                    SendMessages: true
                });

                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setDescription(`🔓 Ticket déverrouillé par ${message.author}`)
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
            } catch (error) {
                console.error(error);
                await message.reply('❌ Erreur lors du déverrouillage du ticket.');
            }
        }

        // Commande add (ajouter un membre au ticket)
        else if (command === 'add') {
            if (!ticketData.has(message.channel.id)) {
                return message.reply('❌ Cette commande ne peut être utilisée que dans un ticket.');
            }

            if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return message.reply('❌ Vous n\'avez pas la permission d\'ajouter des membres à ce ticket.');
            }

            const user = message.mentions.users.first();
            if (!user) {
                return message.reply('❌ Veuillez mentionner un utilisateur à ajouter.');
            }

            const member = message.guild.members.cache.get(user.id);
            if (!member) {
                return message.reply('❌ Utilisateur introuvable sur ce serveur.');
            }

            try {
                await message.channel.permissionOverwrites.create(member, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                });

                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setDescription(`➕ ${user} a été ajouté au ticket par ${message.author}`)
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
            } catch (error) {
                console.error(error);
                await message.reply('❌ Erreur lors de l\'ajout du membre.');
            }
        }

        // Commande rename (renommer le salon du ticket)
        else if (command === 'rename') {
            if (!ticketData.has(message.channel.id)) {
                return message.reply('❌ Cette commande ne peut être utilisée que dans un ticket.');
            }

            if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return message.reply('❌ Vous n\'avez pas la permission de renommer ce ticket.');
            }

            const newName = args.join('-').toLowerCase();
            if (!newName) {
                return message.reply('❌ Veuillez fournir un nouveau nom pour le salon.');
            }

            try {
                const oldName = message.channel.name;
                await message.channel.setName(newName);

                const embed = new EmbedBuilder()
                    .setColor('#0099FF')
                    .setDescription(`📝 Salon renommé de \`${oldName}\` vers \`${newName}\` par ${message.author}`)
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
            } catch (error) {
                console.error(error);
                await message.reply('❌ Erreur lors du renommage du salon.');
            }
        }

    } catch (error) {
        console.error('Erreur lors de l\'exécution de la commande:', error);
        await message.reply('❌ Une erreur est survenue lors de l\'exécution de la commande.');
    }
});

// Événement : Interaction avec les boutons
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;

    try {
        // Bouton pour ouvrir un ticket
        if (interaction.customId === 'open_ticket') {
            // Vérifier si l'utilisateur a déjà un ticket ouvert
            const existingTicket = interaction.guild.channels.cache.find(
                channel => channel.name === `ticket-${interaction.user.username.toLowerCase()}`
            );

            if (existingTicket) {
                return interaction.reply({
                    content: `❌ Vous avez déjà un ticket ouvert : ${existingTicket}`,
                    ephemeral: true
                });
            }

            // Créer un modal pour demander la raison
            const modal = new ModalBuilder()
                .setCustomId('ticket_reason_modal')
                .setTitle('Ouverture de ticket');

            const reasonInput = new TextInputBuilder()
                .setCustomId('ticket_reason')
                .setLabel('Raison de l\'ouverture du ticket')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Décrivez brièvement votre problème...')
                .setRequired(true)
                .setMaxLength(500);

            const actionRow = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(actionRow);

            await interaction.showModal(modal);
        }

        // Modal pour la raison du ticket
        else if (interaction.customId === 'ticket_reason_modal') {
            const reason = interaction.fields.getTextInputValue('ticket_reason');

            // Créer le salon de ticket
            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username.toLowerCase()}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    },
                    {
                        id: client.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    }
                ]
            });

            // Stocker les informations du ticket
            ticketData.set(ticketChannel.id, {
                userId: interaction.user.id,
                reason: reason,
                createdAt: new Date()
            });

            // Créer l'embed d'accueil du ticket
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#9932CC')
                .setTitle('🎫 Nouveau Ticket')
                .setDescription(`Bonjour ${interaction.user}, votre ticket a été créé avec succès !`)
                .addFields(
                    { name: '👤 Créé par', value: `${interaction.user}`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false },
                    { name: '🕐 Créé le', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setFooter({ text: 'L\'équipe de support vous répondra bientôt.' })
                .setTimestamp();

            // Bouton pour fermer le ticket
            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Fermer le ticket')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️');

            const buttonRow = new ActionRowBuilder().addComponents(closeButton);

            await ticketChannel.send({
                content: `${interaction.user} Votre ticket a été créé !`,
                embeds: [welcomeEmbed],
                components: [buttonRow]
            });

            await interaction.reply({
                content: `✅ Votre ticket a été créé : ${ticketChannel}`,
                ephemeral: true
            });
        }

        // Bouton pour fermer le ticket
        else if (interaction.customId === 'close_ticket') {
            if (!ticketData.has(interaction.channel.id)) {
                return interaction.reply({
                    content: '❌ Cette action ne peut être effectuée que dans un ticket.',
                    ephemeral: true
                });
            }

            const ticketInfo = ticketData.get(interaction.channel.id);
            
            // Seul le créateur du ticket ou un admin peut le fermer
            if (interaction.user.id !== ticketInfo.userId && 
                !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return interaction.reply({
                    content: '❌ Seul le créateur du ticket ou un administrateur peut le fermer.',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription(`🗑️ Ticket fermé par ${interaction.user}.\nCe salon sera supprimé dans 5 secondes...`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Supprimer le ticket après 5 secondes
            setTimeout(async () => {
                ticketData.delete(interaction.channel.id);
                await interaction.channel.delete();
            }, 5000);
        }

    } catch (error) {
        console.error('Erreur lors de l\'interaction:', error);
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: '❌ Une erreur est survenue.',
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                ephemeral: true
            });
        }
    }
});

// Gestion des erreurs
client.on('error', console.error);
client.on('warn', console.warn);

// Connexion du bot
client.login(token);
