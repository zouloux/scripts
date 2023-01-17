
/**
 * This Phoenix script will replace all windows in their correct space.
 * Because MacOS will randomly move them to another space when getting out of sleep.
 *
 * DOC : https://kasper.github.io/phoenix/
 * To see logs : log stream --process Phoenix --style compact
 *
 * To load this script
 * ~/.phoenix.js -> require("/Users/USER/Library/Mobile Documents/com~apple~CloudDocs/Phoenix scripts/patch-spaces.js");
 */

console.log("------------------ PHOENIX LOADING ------------------")

// ----------------------------------------------------------------------------- CONFIG


// List of apps to move to spaces.
// Key is space index, value is an array of apps allowed for this space.
const appsBySpaces = [
	// ---- SCREEN 1
	// Space 1 : music
	["Spotify", "SoundCloud"],
	// Space 2 : internet
	[],
	// Space 3 : localhost
	[],
	// Space 4 : design
	["Figma", "Photoshop"],

	// ---- SCREEN 2
	// Space 1 : Organisation
	["Calendar", "KeePassXC", "Anybox", "Notes"],
	// Space 2 : Chat
	["Franz", "Messages"],
	// Space 3 : Code
	["PhpStorm", "Sublime Text"],
	// Space 4 : Files
	["Finder"],
]

// Delay configs, tweak if window are not founds
// Start delay is only to let time to the notification to show
const startDelay = .15
// Delay of space switching when focusing a window.
const focusWindowDelay = .32
// Delay to move a window to another space
const moveWindowDelay = .1

// Phoenix config
Phoenix.set({
	daemon: true,
	openAtLogin: true
});

// ----------------------------------------------------------------------------- EVENTS

Phoenix.notify('Phoenix reloaded');
const shortcut = new Key("space", ["cmd", "option", "control"], patchWindowPositions);

// ----------------------------------------------------------------------------- PATCH WINDOW POSITIONS

function patchWindowPositions () {

	console.log("--- patchWindowPositions ---")
	Phoenix.notify('Moving windows, please wait.');
	shortcut.disable();

	// Each action need some delay to work properly.
	// We cannot use "await delay" in "for of" here so we have to compute delays manually.
	let actionIndex = 0;
	const actionDelay = () => (actionIndex++) * (focusWindowDelay + moveWindowDelay)

	// Let the notification show
	Timer.after(startDelay, () => {
		// Get all spaces
		const spaces = Space.all();

		// Browse every apps
		for ( const appNames of appsBySpaces ) {
			for ( const appName of appNames ) {
				// Get the app and check if its running
				// NOTE : We cannot browse windows because windows are accessible here
				// only after the app is focused
				// https://github.com/kasper/phoenix/issues/131
				// https://github.com/kasper/phoenix/issues/290
				const application = App.get( appName )
				if ( !application ) {
					console.log(`Application ${appName} not found`);
					continue;
				}
				// Wait a bit to allow previous window focus to happen
				Timer.after(actionDelay(), () => {
					// Focus this window ( takes time if not on current space )
					console.log(`Focusing ${appName} ...`);
					application.focus();
					// Wait a bit to move the window
					Timer.after(moveWindowDelay / 2, () => {
						// Target the main window
						const mainWindow = application.mainWindow()
						if ( !mainWindow ) {
							console.log(`${appName} window not found`);
							return;
						}
						// Get the space we want this window on
						const index = appsBySpaces.indexOf(appNames  );
						if ( !(index in spaces)) {
							console.log(`Space ${index} not found`);
							return;
						}
						// Move all windows of this app to this space
						const windows = application.windows();
						console.log(`Moving ${appName} windows to space ${index}`)
						spaces[ index ].moveWindows([ mainWindow ])
						Timer.after(moveWindowDelay / 2, () => {
							spaces[ index ].moveWindows([...windows])
						})
					})
				})
			}
		}

		Timer.after(actionDelay(), () => {
			Phoenix.notify('Windows replaced 👍');
			shortcut.enable();
		})
	});
}