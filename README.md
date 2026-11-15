# TaskFlow

TaskFlow is a mobile productivity app for organizing tasks, building habits, and
tracking focused work. It is built with Expo, React Native, and TypeScript.

## Features

- Create and organize tasks with due dates, categories, priorities, and statuses.
- Schedule local reminders for tasks.
- Track habits and their daily completion history.
- Run focus sessions and optionally associate them with a task.
- View tasks and habits in the calendar, and manage app preferences in your profile.
- Store tasks, habits, focus sessions, and preferences locally with SQLite.

## Run the Android app

Install Node.js and npm, then create and start an Android Virtual Device in
Android Studio's **Device Manager**. From the repository root, run:

```powershell
Set-Location apps\mobile
npm install
npm run android
```

If Expo is already running, press `a` in its terminal to open the Android
emulator.

## Publish the Android download

The website's Android download points to the `taskflow.apk` asset on the
repository's latest GitHub Release. Build a signed, directly installable APK
from `apps\mobile` with an authenticated EAS account:

```powershell
npx eas-cli@latest build --profile download --platform android
```

When the EAS build finishes, download its APK and attach it to a published
GitHub Release with the exact asset name `taskflow.apk`. The website download
will serve that APK from the latest release; it is not available until the
asset has been published. Each build increments Android's version code so
users can install future releases as updates.

## Development

Run these commands from `apps\mobile`:

```powershell
npm start
npm run web
npx expo lint
npx tsc --noEmit
```

Task reminders use device-local notifications and require notification
permission. Remote notifications are not enabled.

## Project structure

- `apps/mobile/src/app/` contains the Expo Router screens.
- `apps/mobile/src/components/` contains reusable interface components.
- `apps/mobile/src/store/` manages app state and SQLite-backed data.

## License

TaskFlow is available under the MIT License. See [LICENSE](./LICENSE).
