import Uwuifier from "uwuifier";

export const Dashboard = {
  domain: "http://localhost",
  port: 8080,
  custom: false // is this a custom domain?
}

export const Colors = {
  white: 0xFEFEFF,
  embed_dark: 0x2f3136,
  black: 0x1C1D21,
  amayi_purple: 0x8783D1,
  amayi_pink: 0xE198AA,
}

export const Emotes = {
  upvote: "upvote:1109734066384797756",
  downvote: "downvote:1109734067953487902"
}

const uwuifier = new Uwuifier({
  spaces: {
    faces: 0.05,
    actions: 0,
    stutters: 0.1,
  }
})
uwuifier.faces = [
  "(・\\`ω´・)",
  ";;w;;",
  "OwO",
  "UwU",
  ">w<",
  "^w^",
  "ÚwÚ",
  "^-^",
  ":3",
  "x3",
]
export const UwU = uwuifier