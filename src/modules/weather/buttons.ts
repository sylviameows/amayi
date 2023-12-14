import { ActionRow, ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuInteraction } from "discord.js";
import { createWeatherAlert, getNewMessage } from "./embeds";
import { getWeatherData } from "./weather";

export const select = {
  button: (location: string) => {
    return new StringSelectMenuBuilder()
      .setCustomId("weather.select#"+location)
      .setPlaceholder("Select one")
      .addOptions({
        label: "Temperature",
        description: "Shows the temperature information for the location.",
        value: "temperature",
      },{
        label: "Forecast",
        description: "Shows the weather information for the location.",
        value: "forecast",
      },{
        label: "Astronomy",
        description: "Shows the sunrise and sunset times.",
        value: "astronomy",
      });
  },
  run: async (interaction: StringSelectMenuInteraction) => {
    const message = interaction.message
    const location = interaction.customId.split("#")[1];
    const data = await getWeatherData(location)
    if (!data) return void interaction.reply({ephemeral: true, content: "an error occured collecting data."})
    interaction.update(getNewMessage(interaction.values[0], data))
  }
}

export const alerts = {
  button: (location: string, alerts: AlertData[]) => {
    return new ButtonBuilder()
      .setCustomId("weather.alerts#"+location)
      .setLabel(alerts.length+" alert(s)")
      .setStyle(ButtonStyle.Danger);
  },
  run: async (interaction: ButtonInteraction) => {
    const location = interaction.customId.split("#")[1];
    const data = await getWeatherData(location)
    if (!data) return void interaction.reply({ephemeral: true, content: "an error occured collecting data."})

    const alerts = data.alerts.alert;
    if (alerts.length == 0) {
      return void await interaction.reply({
        content: `All weather alerts in ${location} have expired.`,
        ephemeral: true
      })
    }

    const embed = createWeatherAlert(alerts[0]).setFooter({
      text: `Alert 1 of ${alerts.length}`,
    });
    const row = new ActionRowBuilder().addComponents(
      pagination.prev(location, -1), 
      pagination.next(location, 1)
    ) // @ts-ignore
    await interaction.reply({embeds: [embed], components: alerts.length > 1 ? [row] : undefined, ephemeral: true})
    
  }
}

export const pagination = {
  button: (location: string, page: number) => {
    return new ButtonBuilder()
      .setCustomId("weather.pagination#"+location+"&"+page)
      .setStyle(ButtonStyle.Secondary);
  },
  next: (location: string, page: number) => pagination.button(location, page).setLabel("Next"),
  prev: (location: string, page: number) => pagination.button(location, page).setLabel("Previous"),
  run: async (interaction: ButtonInteraction) => {
    const args = interaction.customId.split("#")[1].split("&");
    const location = args[0]
    let page = parseInt(args[1])
    const data = await getWeatherData(location)
    if (!data) return void interaction.reply({ephemeral: true, content: "an error occured collecting data."})

    const alerts = data.alerts.alert;
    if (alerts.length == 0) {
      return void await interaction.reply({
        content: `All weather alerts in ${location} have expired.`,
        ephemeral: true
      })
    }

    if (page >= alerts.length) {
      page = 0
    } else if (page < 0) {
      page = alerts.length - 1
    }

    const embed = createWeatherAlert(alerts[page]).setFooter({
      text: `Alert ${page+1} of ${alerts.length}`,
    });
    const row = new ActionRowBuilder().addComponents(
      pagination.prev(location, page-1), 
      pagination.next(location, page+1)
    ) // @ts-ignore
    await interaction.update({embeds: [embed], components: alerts.length > 1 ? [row] : undefined})
  }
}