import { ButtonBuilder, ButtonStyle } from "discord.js"
import GuildSchema from "../../models/GuildSchema"

export class ConfigOption<T> {
  label: string
  style: ButtonStyle
  emoji?: string

  path: string
  id: string

  constructor(id: string, data: { label: string, style?: ButtonStyle, emoji?: string, path: string}) {
    this.path = data.path
    this.id = id

    this.label = data.label
    this.style = data.style ?? ButtonStyle.Secondary
    this.emoji = data.emoji
  }

  public get button() {
    const button = new ButtonBuilder()
      .setLabel(this.label)
      .setStyle(this.style)
      .setCustomId(`config-${this.path}`)
    if (this.emoji) return button.setEmoji(this.emoji)
    return button
  }

  async set(value: T) {
    const model = await GuildSchema.findOrCreate(this.id)
    await model.set(`config.${this.path}`, value).save()
    return value;
  }
}