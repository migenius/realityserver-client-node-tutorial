const path = require('path'),
		fs = require('fs');

const {WebSocketStreamer,Command} = require('realityserver');
WebSocketStreamer.websocket = require('websocket').w3cwebsocket;


require('yargs')
	.demandCommand(7)
	.usage('$0 [--ssl] <host> <port> <scene_file> <width> <height> <max_samples> <filename>','renders an image in RealityServer',yargs=>{
		yargs.positional('host',{
			describe: 'hostname to connect to',
			type: 'string'
		})
		.positional('port',{
			describe: 'port to connect to',
			type: 'number'
		})
		.positional('scene_file',{
			describe: 'scene filename to render',
			type: 'string'
		})
		.positional('width',{
			describe: 'image width to render',
			type: 'number'
		})
		.positional('height',{
			describe: 'image height to render',
			type: 'number'
		})
		.positional('max_samples',{
			describe: '# of samples to render',
			type: 'number'
		})
		.positional('filename',{
			describe: 'output filename, extension defines the file format',
			type: 'string'
		});
	},render)
	.boolean('ssl')
	.default('ssl',false)
	.describe('ssl','if true connect using wss, otherwise ws')
	.help('h')
    .alias('h', 'help')
    .argv;

function render(argv) {
	const {host,port,ssl,scene_file,width,height,max_samples,filename} = argv;

	const url = `${(ssl ? 'wss://' : 'ws://')}${host}:${port}/render_loop_stream/`;

	console.log(`connecting to: ${url}`);


	const service = new WebSocketStreamer();
		service.connect(url,
	    () => {
	        console.log(`loading scene: ${scene_file}`);
	        
	        // service.debug_commands(true);

	        service.addCommand(new Command('create_scope',{scope_name:'myscope'}),undefined,undefined,true);
	        service.addCommand(new Command('use_scope',{scope_name:'myscope'}),undefined,undefined,true);

	        service.addCommand(new Command('import_scene',
	        								{
									        	scene_name:'myscene',
									        	block:true,
									        	filename: scene_file
									        }),
	        	(resp) => {
	        		if (resp.error) {
	        			console.log('scene load error: ' + JSON.stringify(resp));
	        			service.close();
	        			return;
	        		}
	        		console.log(`rendering at ${width}x${height} for ${max_samples} iterations`);

	        		const camera = resp.result.camera;
	        		const options = resp.result.options;

					service.addCommand(new Command('use_scope',{scope_name:'myscope'}),undefined,undefined,true);
	        		service.addCommand(new Command('camera_set_resolution',{
	        			camera_name:camera,
	        			resolution: {
	        				x:parseInt(width,10),
	        				y:parseInt(height,10)
	        			}
	        		}),undefined,undefined,true);
	        		service.addCommand(new Command('camera_set_aspect',{
	        			camera_name:camera,
	        			aspect: parseFloat(width,10) / parseFloat(height,10)
	        		}),undefined,undefined,true);
	        		service.addCommand(new Command('element_set_attribute',{
	        			element_name:options,
	        			attribute_name: 'progressive_rendering_max_samples',
	        			attribute_value: parseInt(max_samples,10),
	        			attribute_type: 'Sint32'
	        		}),undefined,undefined,true);
		
	        		service.addCommand(new Command('render',
	        										{
											        	scene_name:'myscene',
											        	renderer:'iray',
											        	format: path.extname(filename).slice(1),
											        	render_context_options: {
											        		scheduler_mode: {
											        			value: 'batch',
											        			type: 'String'
											        		}
											        	}
											        }),
			        	(resp) => {
			        		service.close();

			        		if (resp.error) {
			                   	console.error('render error: ' + resp.error);
				                return;
			        		}
		        			const image = resp.result;
		        			if (!image.data) {
		        				console.error('no rendered image');
		        				return;
		        			}
		        			fs.writeFile(filename,image.data,(err) => {
								if (err) {
									console.error('error writing file ' + err);
								} else {
							 		console.log(`image saved to ${filename}`);
							 	}
							});
			        	}
			        );
	        	});
	    },
	    err => {
	        console.error('Web Socket connection failed: ' + JSON.stringify(err));
	    },
	    // exta arguments to pass to WS constructor to ensure a user-agent is set to avoid an Iray bug.
	    [undefined, { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36' }]
	);
}