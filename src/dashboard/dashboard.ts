import Amayi from "../structures/Amayi"
import path from "path"
import express, { NextFunction } from "express"
import passport from "passport"
import session from "express-session"
import { Dashboard } from "../config"
import ejs from "ejs"
import bodyParser from "body-parser"
import url from "url"
import GuildSchema from "../models/GuildSchema"
import { Guild, PermissionsBitField } from "discord.js"
import { client } from ".."

const Strategy = require("passport-discord").Strategy
const app = express()
const MemoryStore = require("memorystore")(session)

export default async (client: Amayi) => {
  const dataDir = path.resolve(`${process.cwd()}${path.sep}src${path.sep}dashboard`)
  const templateDir = path.resolve(`${dataDir}${path.sep}templates`)

  passport.serializeUser((user, done) => done(null, user)) // @ts-ignore
  passport.deserializeUser((obj, done) => done(null, obj))

  // Validating the url by creating a new instance of an Url then assign an object with the host and protocol properties.
  // If a custom domain is used, we take the protocol, then the hostname and then we add the callback route.
  // Ex: Config key: https://localhost/ will have - hostname: localhost, protocol: http

  var callbackUrl, domain;
  try  {
    const domainUrl = new URL(Dashboard.domain)
    domain = {
      host: domainUrl.hostname,
      protocol: domainUrl.protocol
    }
  } catch (e) {
    console.log(e)
    throw new TypeError("Invalid domain specified in .env file.")
  }

  if (Dashboard.custom) {
    callbackUrl = `${domain.protocol}//${domain.host}/callback`
  } else {
    callbackUrl = `${domain.protocol}//${domain.host}${Dashboard.port == 80 ? "" : `:${Dashboard.port}`}/callback`
  }

  console.log(`use this url as the redirect url in discord auth: ${callbackUrl}`)

  // discord authentication using the discord strategy
  passport.use(new Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackUrl: callbackUrl,
    scope: ["identify", "guilds"] // @ts-ignore
  }, (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => done(null, profile))
  }))

  app.use(session({
    store: new MemoryStore({ checkPeriod: 86400000 }),
    secret: process.env.DASHBOARD_SECRET as string,
    resave: false,
    saveUninitialized: false,
  }))

  app.use(passport.initialize());
  app.use(passport.session());

  app.locals.domain = Dashboard.domain.split('//')[1]

  app.engine("html", ejs.renderFile)
  app.set("view engine", "html")

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }))

  app.use("/", express.static(path.resolve(`${dataDir}${path.sep}assets`)))

  const renderTemplate = (req: any, res: any, template: any, data = {}) => {
    const baseData = {
      bot: client,
      path: req.path,
      user: req.isAuthenticated() ? req.user : null,
    };
    res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(baseData, data))
  }

  const checkAuth = (req: any, res: any, next: NextFunction) => {
    if (req.isAuthenticated()) return next();
    req.session.backURL = req.url;
    res.redirect("/login")
  }

  app.get("/login", (req, res, next) => { 
    if (req.session.backURL) {
      req.session.backURL = req.session.backURL
    } else if (req.headers.referer) {
      const parsed = url.parse(req.headers.referer)
      if (parsed.hostname === app.locals.domain) {
        req.session.backURL = parsed.path
      }
    } else { 
      req.session.backURL = "/";
    }
    next()
  }, passport.authenticate("discord"))

  app.get("/callback", passport.authenticate("discord", { failureRedirect: "/" }), (req: any, res: any) => {
    if (req.session.backURL) {
      const url = req.session.backURL;
      req.session.backURL = null;
      res.redirect(url);
    } else {
      res.redirect("/")
    }
  })

  app.get("/logout", (req, res) => {
    req.session.destroy(() => { // @ts-ignore
      req.logout()
      res.redirect('/')
    })
  })

  app.get("/", (req, res) => {
    renderTemplate(req, res, "index.ejs");
  })

  app.get("/features", (req, res) => {
    renderTemplate(req, res, "features.ejs");
  })

  app.get("/dashboard", checkAuth, (req, res) => {
    renderTemplate(req, res, "dashboard.ejs", { perms: PermissionsBitField })
  })

  app.get("/dashboard/:guildID", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID)
    if (!guild) return res.redirect("/dashboard") // @ts-ignore
    const member = guild.members.cache.get(req.user?.id)
    if (!member) return res.redirect("/dashboard")
    if (!member.permissions.has("ManageGuild")) return res.redirect("/dashboard")

    // get the settings for the guild
    const settings = await GuildSchema.findOrCreate(req.params.guildID)
    renderTemplate(req, res, "settings.ejs", { guild, settings, alert: null})
  })

  app.post("/dashboard/:guildID", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID)
    if (!guild) return res.redirect("/dashboard") // @ts-ignore
    const member = guild.members.cache.get(req.user?.id)
    if (!member) return res.redirect("/dashboard")
    if (!member.permissions.has("ManageGuild")) return res.redirect("/dashboard")

    const settings = await GuildSchema.findOrCreate(req.params.guildID)
    
    settings.prefix = req.body.prefix;

    try {
      settings.config!.staff_roles = [req.body.staff_role]

      settings.config!.petitions!.enabled = req.body.petitions_enabled
      settings.config!.petitions!.channel_id = req.body.petitions_channel
      settings.config!.petitions!.role = req.body.petitions_role

      settings.config!.quotes!.enabled = req.body.quotes_enabled
      settings.config!.quotes!.channel_id = req.body.quotes_channel
      settings.config!.quotes!.role = req.body.quotes_role

      settings.config!.reporting!.enabled = req.body.reporting_enabled
      settings.config!.reporting!.channel_id = req.body.reporting_channel
      settings.config!.reporting!.role = req.body.reporting_role
    } catch (e) {
      renderTemplate(req, res, "settings.ejs", {guild, settings, alert: `Your settings failed to save.`})
      return
    }

    await settings.save().catch(() => {})
    renderTemplate(req, res, "settings.ejs", {guild, settings, alert: "Your settings have been saved."})
  })

  app.listen(Dashboard.port, () => console.log(`Dashboard is running on port ${Dashboard.port}`))
}