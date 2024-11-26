import { ActionRowBuilder, bold, Message } from "discord.js";
import { client } from "../..";
import { createTemperatureEmbed } from "./embeds";
import { alerts, select } from "./buttons";

export default async function weather(
  location: string, 
  message: Message
): Promise<any> {
  const data: WeatherData | void = await getWeatherData(location);
  if (!data) return;

  if (data.error) return await message.reply(bold("! ") + data.error.message);

  const alertsData = data.alerts.alert
  const string = getLocationString(data)

  const selectionRow = new ActionRowBuilder().addComponents(
    select.button(location)
  )
  const alertRow = new ActionRowBuilder().addComponents(
    alerts.button(location, alertsData)
  )

  return await message.reply({ 
    content: `It is currently \`${data.current.temp_f}°F\` (\`${data.current.temp_c}°C\`) in ${string}`, 
    embeds: [createTemperatureEmbed(data, string)], // @ts-ignore
    components: alertsData.length > 0 ? [selectionRow, alertRow] : [selectionRow],
    allowedMentions: {parse: []}
  })
}


// `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY ?? "nokey"}&q=${location}&alerts=yes`
function URI(page: string, location: string, options: {key: string, value: string}[] = []) {
  let query = "";
  options.forEach(option => query = query+`&${option.key}=${option.value}`)
  return `https://api.weatherapi.com/v1/${page}.json?key=${process.env.WEATHER_API_KEY ?? "nokey"}&q=${location}${query}`
}


export async function getWeatherData(location: string): Promise<WeatherData | void> {
  const cache = client.cache.weather
  let data = cache.get("location");

  const diff = (time: number) => Date.now() - time;
  if (!data || diff(data.lastCall) > 180000) {
    const res = await fetch(URI("forecast", location, [{key: "alerts", value: "yes"}]), {method: "GET"})
    const filtered = await res.json().then(json => filterAlerts(json as WeatherData))
    cache.set(filtered.error ? location : getLocationString(filtered), {data: filtered, lastCall: Date.now()});
    return filtered;
  }
  return data.data;
}

function filterAlerts(data: WeatherData): WeatherData {
  if (data.error) return data;
  const alerts = data.alerts.alert;
  const filtered: AlertData[] = [];

  alerts.forEach(alert => {
    const now = Date.now()
    const effective = new Date(alert.effective);
    const expires = new Date(alert.expires);

    if (expires.getTime() > now) {
      alert.effective = effective[Symbol.toPrimitive]("string");
      alert.expires = expires[Symbol.toPrimitive]("string")
      filtered.push(alert);
    }
  })

  data.alerts.alert = filtered;
  return data;
}

export function getLocationString(data: WeatherData): string {
  let string = `${data.location.name}, ${data.location.country}`;
  if (
    data.location.country == "United States of America" ||
    data.location.country == "USA United States of America"
  ) {
    string = `${data.location.name}, ${data.location.region}`
  }
  return string;
}