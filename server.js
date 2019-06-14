const express = require('express');
const app = express();
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const fileType = require('file-type');
const readChunk = require('read-chunk');

const handleError = (err, res) => {
	res.status(500)
	.contentType("text/plain")
	.end("Something went wrong.");
	console.log(err);
};
const dest = path.join(__dirname, '/images/');
const upload = multer({
	dest: dest
});

const staticPath = path.join(__dirname, 'public');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', express.static(staticPath));

let width = 300;
let height = 200;

app.post('/upload', upload.single("photo"), (req, res)=>{
	const tempPath = req.file.path;
	const targetPath = path.join(__dirname, '/images/' + req.file.originalname);
	const outputPath = path.join(__dirname, '/images/resized_' + req.file.originalname);

	let width;
	let height;
	let compress = 0;
	let rotate = 0;
	if(req.body.imgWidth){
		let temp = parseInt(req.body.imgWidth);
		if(temp < 10000) {
			width = temp;
		}
	}
	if(req.body.imgHeight){
		let temp = parseInt(req.body.imgHeight);
		if(temp < 10000) {
			height = temp;
		}
	}
	if(req.body.compress){
		let temp = parseInt(req.body.compress);
		if(temp > 0 && temp < 101) {
			compress = temp;
		}
	}
	if(req.body.degrees){
		let temp = parseInt(req.body.degrees);
		if(temp % 90 == 0) {
			rotate = temp;
		}
	}
	function respond() {
		res.download(outputPath);
	}
	function deleteFiles(){
		setTimeout(()=> {
			fs.unlink(targetPath, (err) => {
				if (err)
					console.error("Error deleting: ", filePath);
			});
			fs.unlink(outputPath, (err) => {
				if (err)
					console.error("Error deleting: ", filePath);
			});
		}, 10 * 1000);
	}
	fs.rename(tempPath, targetPath, err => {
		if(err) return handleError(err, res)
		else {
			const buffer = readChunk.sync(targetPath, 0, fileType.minimumBytes);
					if(fileType(buffer).ext == 'png') {
						sharp(targetPath)
							.png({compressionLevel: 9})
							.rotate(rotate)
							.resize(width, height)
							.toBuffer()
							.then( data => {
								fs.writeFileSync(outputPath, data);
								console.log('Converted: '+ req.file.originalname);
								respond();
							})
							.catch( err => {
								console.log(err);
							});
					}else if(fileType(buffer).ext == 'jpg'){
						sharp(targetPath)
							.jpeg({compressionLevel: compress})
							.rotate(rotate)
							.resize(width, height)
							.toBuffer()
							.then( data => {
								fs.writeFileSync(outputPath, data);
								console.log('Converted: '+ req.file.originalname);
								respond();
							})
							.catch( err => {
								console.log(err);
							});
					}else if(fileType(buffer).ext == 'webp'){
						sharp(targetPath)
							.webp({lossless: true})
							.rotate(rotate)
							.resize(width, height)
							.toBuffer()
							.then( data => {
								fs.writeFileSync(outputPath, data);
								console.log('Converted: '+ req.file.originalname);
								respond();
							})
							.catch( err => {
								console.log(err);
							});
					}
			}
	});
});

app.listen(8080, ()=> {
	console.log("Running ImageCompressor Server...");
});
