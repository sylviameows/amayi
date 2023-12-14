// TODO - rework this file later to make it easier to add new pages.

import { EmbedBuilder, Interaction, Message, MessageEditOptions, codeBlock } from "discord.js";
import { rateHeatIndex, calculateHeatIndex } from "./calculations";
import { getLocationString } from "./weather";

export function getNewMessage(page: string, data: WeatherData): MessageEditOptions {
  const location = getLocationString(data);

  if (page == "temperature") {
    return {content: `It is currently \`${data.current.temp_f}°F\` (\`${data.current.temp_c}°C\`) in ${location}`, embeds: [createTemperatureEmbed(data, location)]}
  } else if (page == "forecast") {

    let content;
    const today = data.forecast.forecastday[0].day;
    if (
      today.daily_will_it_snow == 1 &&
      today.daily_will_it_rain == 1
    ) {
      content = `It will rain and snow today in ${location}`;
    } else if (today.daily_will_it_rain == 1) {
      content = `It will rain today in ${location}`;
    } else if (today.daily_will_it_snow == 1) {
      content = `It will snow today in ${location}`;
    } else {
      content = `There is no rain or snow projected in ${location}.`;
    }

    return {content, embeds: [createForecastEmbed(data, location)]}
  } else if (page == "astronomy") {
    return {content: `The sun rises at \`${data.forecast.forecastday[0].astro.sunrise}\` and sets at \`${data.forecast.forecastday[0].astro.sunset}\` in ${location}`, embeds: [createAstronomyEmbed(data, location)]}
  }
  return {content: "an error occured..."}
}

export function createWeatherAlert(alert: AlertData): EmbedBuilder {
  let desc = alert.desc;
  if (desc.length > 4096) {
    desc = `${desc.slice(0, 4000)}`;
  }

  let instruc = alert.instruction;
  if (instruc.length > 1024) {
    instruc = `${desc.slice(0, 1000)}`;
  }

  const embed = new EmbedBuilder()
    .setTitle(alert.event)
    .setAuthor({ name: alert.headline })
    .setDescription(codeBlock(desc))
    .addFields(
      {
        name: "Effective",
        value: codeBlock(alert.effective),
        inline: true,
      },
      {
        name: "Expires",
        value: codeBlock(alert.expires),
        inline: true,
      }
    );

  if (alert.instruction)
    embed.addFields({
      name: "Instructions",
      value: codeBlock(instruc),
    });

  return embed;
}

export function createTemperatureEmbed(
  data: WeatherData,
  location: string
): EmbedBuilder {
  const today = data.forecast.forecastday[0].day;
  const heatIndex = rateHeatIndex(calculateHeatIndex(data.current.temp_f, data.current.humidity))
  const embed = new EmbedBuilder()
    .setThumbnail(`https:${data.current.condition.icon}`)
    .setTitle(location)
    .setDescription(
      `It is currently \`${data.current.condition.text}\` in ${location}`
    )
    .setTimestamp(data.current.last_updated_epoch * 1000)
    .setFooter({ text: `Updated` })
    .addFields(
      {
        name: "Temperature",
        value: codeBlock(`${data.current.temp_f}°F (${data.current.temp_c}°C)`),
        inline: true,
      },
      {
        name: "High",
        value: codeBlock(
          `${today.maxtemp_f}°F (${today.maxtemp_c}°C)`
        ),
        inline: true,
      },
      {
        name: "Low",
        value: codeBlock(
          `${today.mintemp_f}°F (${today.mintemp_c}°C)`
        ),
        inline: true,
      },
      {
        name: "Feels Like",
        value: codeBlock(
          `${data.current.feelslike_f}°F (${data.current.feelslike_c}°C)`
        ),
        inline: true,
      },
      {
        name: "Wind",
        value: codeBlock(
          `${data.current.wind_dir} at ${data.current.wind_mph}mph (${data.current.wind_kph}kph)`
        ),
        inline: true,
      }
    );
  if (heatIndex) return embed.addFields({
    name: `Heat Index Level: ${heatIndex.class}`,
    value: `${heatIndex.warn}`
  }).setColor(heatIndex.color)
  return embed
}

export function createForecastEmbed(
  data: WeatherData,
  location: string
): EmbedBuilder {
  const forecast: ForecastData = data.forecast.forecastday[0];
  const embed = new EmbedBuilder()
    .setThumbnail(`https:${forecast.day.condition.icon}`)
    .setTitle(location)
    .setDescription(
      `It is \`${forecast.day.condition.text}\` today in ${location}`
    )
    .setFooter({ text: `${forecast.date}` })
    .addFields(
      {
        name: "Average Temperature",
        value: codeBlock(
          `${forecast.day.avgtemp_f}°F (${forecast.day.avgtemp_c}°C)`
        ),
        inline: true,
      },
      {
        name: "Visibility",
        value: codeBlock(
          `${forecast.day.avgvis_miles} miles (${forecast.day.avgvis_km}km)`
        ),
        inline: true,
      },
      {
        name: "Humidity",
        value: codeBlock(`${forecast.day.avghumidity}%`),
        inline: true,
      },
      {
        name: "Precipitation (rain)",
        value: codeBlock(
          `${forecast.day.totalprecip_in}in (${forecast.day.totalprecip_mm}mm)`
        ),
        inline: true,
      },
      {
        name: "Precipitation (snow)",
        value: codeBlock(`${forecast.day.totalsnow_cm}cm`),
        inline: true,
      }
    );

  return embed;
}

export function createAstronomyEmbed(
  data: WeatherData,
  location: string
): EmbedBuilder {
  const forecast: ForecastData = data.forecast.forecastday[0];

  let time = data.location.localtime.split(" ")[1];
  const split = time.split(":");
  if (parseInt(split[0]) > 12) {
    time = `${parseInt(split[0]) - 12}:${split[1]} PM`;
  } else if (parseInt(split[0]) == 12) {
    time = `${time} PM`;
  } else if (parseInt(split[0]) == 0) {
    time = `12:${split[1]} AM`;
  } else {
    time = `${time} AM`;
  }

  return new EmbedBuilder()
    .setThumbnail(`https:${forecast.day.condition.icon}`)
    .setTitle(location)
    .setDescription(
      `It is \`${time}\` in ${location} (<t:${data.location.localtime_epoch}:t>)`
    )
    .setTimestamp(data.current.last_updated_epoch * 1000)
    .setFooter({ text: `Updated` })
    .addFields(
      {
        name: "Sunrise",
        value: codeBlock(`${forecast.astro.sunrise}`),
        inline: true,
      },
      {
        name: "Sunset",
        value: codeBlock(`${forecast.astro.sunset}`),
        inline: true,
      },
      {
        name: "Cloud Cover",
        value: codeBlock(`${data.current.cloud}%`),
        inline: true,
      },
      {
        name: "Moonrise",
        value: codeBlock(`${forecast.astro.moonrise}`),
        inline: true,
      },
      {
        name: "Moonset",
        value: codeBlock(`${forecast.astro.moonset}`),
        inline: true,
      },
      {
        name: "Moon Phase",
        value: codeBlock(`${forecast.astro.moon_phase}`),
        inline: true,
      }
    );
}
