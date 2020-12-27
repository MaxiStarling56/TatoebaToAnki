// Required pacages
const fs = require('fs');
const eventStream = require('event-stream');

// Version number
const version = require('./package.json').version || 'error';

// Anki output file

// Helper functions
const printHelpMessage = () => {
	console.log(
		'TatoebaToAnki - Create Anki cards via Tatoeba translations.\n'
	);
	console.log(
		"Usage: node gen.js 'lang1_sentences.tsv' 'links.csv' 'lang2_sentences.tsv'\n"
	);
	console.log('  Options:');
	console.log('    -h, --help     Show this help message');
	console.log('    -V, --version  Show the version number');

	process.exit(0);
};
const printVersion = () => {
	console.log(version);
	process.exit(0);
};

// Check parameter options
if (process.argv[2] && process.argv[2].startsWith('-')) {
	switch (['-h', '--help', '-V', '--version'].indexOf(process.argv[2])) {
		case 0:
			printHelpMessage();

		case 1:
			printHelpMessage();

		case 2:
			printVersion();

		case 3:
			printVersion();

		default:
			console.error(
				`Parameter '${process.argv[2]}' not recognized, use (node script -h)`
			);
			process.exit(1);
	}
}

// Check that the given files exists.
if (!fs.existsSync(process.argv[2])) {
	console.error(`File '${process.argv[2]}' does not exists!`);
	process.exit(1);
}
if (!fs.existsSync(process.argv[3])) {
	console.error(`File '${process.argv[3]}' does not exists!`);
	process.exit(1);
}
if (!fs.existsSync(process.argv[4])) {
	console.error(`File '${process.argv[4]}' does not exists!`);
	process.exit(1);
}

// Start the time counter
const computeTimeLabel = 'Anki cards file generated in';
console.time(computeTimeLabel);

// Array containing the languages
const lang1 = [];
const lang2 = [];

// Creating the file strams
const lang1Stream = fs.createReadStream(process.argv[2]);
const lang2Stream = fs.createReadStream(process.argv[4]);
const ankiSteam = fs.createWriteStream('./anki_compiled.tsv');

/**
 * When the two languages are loaded
 * 	for every line of the links file we check if the current relation exists
 * 	in the languages arrays
 */
const streamEnded = (stream) => {
	console.log(`${stream} loaded!`);

	if (lang1Stream.readableEnded && lang2Stream.readableEnded) {
		console.log('generating the compiled anki file...');
		fs.createReadStream(process.argv[3])
			.pipe(eventStream.split())
			.pipe(
				eventStream.map((line, cb) => {
					const data = line.split('\t');

					if (lang2[data[0]]) {
						if (lang1[data[1]]) {
							ankiSteam.write(
								`${lang2[data[0]]}\t${lang1[data[1]]}\n`
							);
						}
					}

					cb(null, null);
				})
			)
			.on('error', (err) => {
				console.error(`(linkSream) ${err.name} - ${err.message} `);
				process.exit(1);
			})
			.on('end', () => {
				ankiSteam.destroy();
				console.timeEnd(computeTimeLabel);
				process.exit(0);
			});
	}
};

/**
 * We create a read stream so that we can load the file line by line
 * 	without overloading the ram.
 * For every line split it and load in the specific array index the phrase.
 */
lang1Stream
	.pipe(eventStream.split())
	.pipe(
		eventStream.map((line, cb) => {
			const data = line.split('\t');

			lang1[data[0]] = data[2];

			cb(null, null);
		})
	)
	.on('error', (err) => {
		console.error(`(lang1Stream) ${err.name} - ${err.message} `);
		process.exit(1);
	})
	.on('end', () => streamEnded(lang1Stream.path));

/**
 * Same as the other stream
 */
lang2Stream
	.pipe(eventStream.split())
	.pipe(
		eventStream.map((line, cb) => {
			const data = line.split('\t');

			lang2[data[0]] = data[2];

			cb(null, null);
		})
	)
	.on('error', (err) => {
		console.error(`(lang2Stream) ${err.name} - ${err.message} `);
		process.exit(1);
	})
	.on('end', () => streamEnded(lang2Stream.path));
