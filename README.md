<div align="center"><a href="https://vercel.com/?utm_source=mag-lit&utm_campaign=oss"><img src="https://user-images.githubusercontent.com/25067102/178521042-fc564081-9b44-4988-aa80-eb53f57642d5.svg" /></a>

MagLit has been sponsored by Vercel. Many thanks!

</div>
<div align="center"><img src="https://user-images.githubusercontent.com/25067102/165503689-d1d9eb36-7f00-423b-bf38-89698deb9d3e.jpg" />
</div>

<div align="center">
<h1>Mag🔥Lit</h1>

🔥 MagLit - A **super fast** and **easy-to-use** **Free** and **Open Source Privacy Respecting Encrypted** Magnet/HTTP(s) Link Shortener with **Password Protection** 🔥

### https://maglit.me

</div>

# 🔥 Featured on [Awesome Open Source](https://awesomeopensource.com/) and [Awesome Privacy](https://github.com/pluja/awesome-privacy#link-shorteners)

## MagLit Features

✅ 100% Easy to use\
✅ 100% Free and Open Source\
✅ 100% Encrypted\
✅ 100% Private\
✅ 0% Personal Data stored

New Features  
🆕 MagLit now supports custom links!  
🆕 MagLit now lets you generate QR Codes for your lit links!

**WYSIWYG:** [MagLit builds are fully verifiable: The code in this repository is the same code that's deployed on MagLit.me, Nothing added, nothing ripped, so you know it's 100% trusted ;) ](https://github.com/NayamAmarshe/MagLit/deployments)

## Self Hosting

**PREPARE**

MagLit uses Firebase Firestore as a database. You must first create a new Firebase project, then a file with the name `.env.local` in root directory of the project and fill the details as mentioned in `.env.local.example`.

This step is a **hard requeriment** and any change to this file, **requires a rebuild to the project from scratch** (either through npm install/npm run dev or by using the docker steps)

Clone the project and install dependencies using:

```bash
npm install
```

You need npm or yarn installed for this.

Then, run the development server:

```bash
npm run dev
```

**DOCKER:**

> [!IMPORTANT]
> Make sure the .env.local file is available before the build.

```bash
#  BUILD AND RUN IMAGE USING NPM
npm run docker:build
# RUN IMAGE
npm run docker
# OR RUN IN DETACHED MODE
npm run docker:d
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/xxxxxx](http://localhost:3000/api/xxxxxx). This endpoint can be edited in `pages/api/xxxxxx.js`.

The `pages/api` directory is mapped to `/api/*`. Read more about [API routes](https://nextjs.org/docs/api-routes/introduction).

<!--
## If you like the project

<a href="https://www.buymeacoffee.com/fossisthefuture">
<img alt="bmc-button" src="https://user-images.githubusercontent.com/25067102/154570688-9e143f2b-fee3-4b05-a9d2-a7a3013b2b51.png" />
</a>
-->

### 🔥 https://maglit.me 🔥
