# App Icons

Gives Claude-hosted phone apps their own home screen icons. Chrome takes a home screen icon from the site it installs, and claude.ai doesn't offer one per app. So each app gets a small installable page here with its own icon, and that page forwards to the real app.

- `apps.json`: the apps, with their names, links and background colors.
- `icons/`: one square icon per app, named after its slug, as `.svg` or `.png`.
- `docs/`: the built site. GitHub Pages serves this folder. Don't edit it by hand.

Keep the important part of an icon inside the middle 60%, because Android crops the edges into its icon shape.

To change an icon, replace the file in `icons/`, run `npm run build`, then commit and push. The phone may pick it up by itself within a few days. To get it right away, remove the icon from the phone and install it again.

To add an app, add it to `apps.json`, add its icon, and build.
