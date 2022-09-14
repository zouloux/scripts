#!/usr/bin/env node

const { Directory } = require("@solid-js/files")
const { oraTask, execAsync, nicePrint } = require("@solid-js/cli")
const path = require( "path" );
const fs = require('fs')

const directoriesToCompress = ['node_modules', 'vendor']
const directoriesToIgnore = ['__A TRIER __', '#recycle', '_TO_NAS', '00 - Archives', '00 - Backups', '01 - Etudes']

async function run () {
	let total = 0;
	let errors = []

	async function recursiveBrowse ( taskUpdater, currentPath ) {
		taskUpdater.setText('Searching')
		taskUpdater.setAfterText(currentPath)
		let files
		try {
			const directory = new Directory( currentPath )
			files = await directory.list({ dot: false })
		}
		catch (error) {
			errors.push({
				phase: 'opening',
				file: currentPath, error
			})
			return;
		}
		for ( const file of files ) {
			// Do not search in file with a dot
			if ( file.indexOf('.') !== -1 ) continue;
			// Only continue on directories
			let isDirectory
			try {
				isDirectory = fs.lstatSync(file).isDirectory()
			}
			catch (error) {
				errors.push({
					phase: 'stat',
					file, error
				})
				continue;
			}
			if ( !isDirectory ) continue;
			// Ignored directories
			const baseName = path.basename( file );
			if ( directoriesToIgnore.indexOf( baseName ) !== -1 ) continue;
			// This is not a directory to compress
			// Do a recursive search in it
			const indexOfDirectoryToCompress = directoriesToCompress.indexOf( baseName );
			if ( indexOfDirectoryToCompress === -1 ) {
				await recursiveBrowse( taskUpdater, file )
				continue;
			}
			// Compress
			taskUpdater.setText('Compressing');
			taskUpdater.setAfterText(file)
			try {
				await execAsync(`tar czf ${directoriesToCompress[indexOfDirectoryToCompress]}.tar.gz --directory=${baseName} .`, 1, {
					cwd: currentPath
				})
			}
			catch (error) {
				errors.push({
					phase: 'compressing',
					file, error
				})
				continue;
			}
			// Remove
			taskUpdater.setText('Deleting')
			taskUpdater.setAfterText(file)
			try {
				await new Directory( file ).delete()
			}
			catch (error) {
				errors.push({
					phase: 'deleting',
					file, error
				})
				continue;
			}
			// Count
			total ++
		}
	}

	await oraTask({
		text: "Searching"
	}, async taskUpdater => {
		await recursiveBrowse( taskUpdater, path.resolve( process.cwd() ) )
		taskUpdater.success(`Done, compressed ${total} node_modules folders.`);
	})

	if ( errors && errors.length > 0 ) {
		nicePrint(`{r}Had {b/r}${errors.length}{r} error(s)`)
		errors.map( e => {
			console.log(e)
		})
	}
}


process.on('uncaughtException', (error, origin) => {
	console.log(err)
	console.log(origin)
	process.exit();
});
process.on('unhandledRejection', (error) => {
	console.log(error)
	process.exit();
});

run();