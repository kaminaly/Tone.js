import { ToneAudioBuffer } from "../core/context/ToneAudioBuffer";
import { optionsFromArguments } from "../core/util/Defaults";
import { noOp } from "../core/util/Interface";
import { Effect, EffectOptions } from "./Effect";

interface ToneConvolverOptions extends EffectOptions {
	onload: () => void;
	normalize: boolean;
	url?: string | AudioBuffer | ToneAudioBuffer;
}

/**
 * Convolver is a wrapper around the Native Web Audio
 * [ConvolverNode](http://webaudio.github.io/web-audio-api/#the-convolvernode-interface).
 * Convolution is useful for reverb and filter emulation. Read more about convolution reverb on
 * [Wikipedia](https://en.wikipedia.org/wiki/Convolution_reverb).
 *
 * @example
 * //initializing the convolver with an impulse response
 * var convolver = new Convolver("./path/to/ir.wav").toDestination();
 */
export class Convolver extends Effect<ToneConvolverOptions> {

		readonly name: string = "Convolver";

	/**
	 *  The native ConvolverNode
	 */
	private _convolver: ConvolverNode = this.context.createConvolver();

	/**
	 *  The Buffer belonging to the convolver
	 */
	private _buffer: ToneAudioBuffer;

	/**
	 * @param url The URL of the impulse response or the Tone.Buffer contianing the impulse response.
	 * @param onload The callback to invoke when the url is loaded.
	 */
	constructor(url?: string | AudioBuffer | ToneAudioBuffer, onload?: () => void);
	constructor(options?: Partial<ToneConvolverOptions>);
	constructor() {

		super(optionsFromArguments(Convolver.getDefaults(), arguments, ["url", "onload"]));
		const options = optionsFromArguments(Convolver.getDefaults(), arguments, ["url", "onload"]);

		this._buffer = new ToneAudioBuffer(options.url, buffer => {
			this.buffer = buffer;
			options.onload();
		});

		// set if it's already loaded
		if (this._buffer.loaded) {
			this.buffer = this._buffer;
		}

		// initially set normalization
		this.normalize = options.normalize;

		// connect it up
		this.connectEffect(this._convolver);
	}

	static getDefaults(): ToneConvolverOptions {
		return Object.assign(Effect.getDefaults(), {
			normalize : true,
			onload : noOp,
		});
	}

	/**
	 * Load an impulse response url as an audio buffer.
	 * Decodes the audio asynchronously and invokes
	 * the callback once the audio buffer loads.
	 * @param url The url of the buffer to load. filetype support depends on the browser.
	 */
	async load(url: string): Promise<void> {
		this.buffer = await this._buffer.load(url);
	}

	/**
	 *  The convolver's buffer
	 */
	get buffer(): ToneAudioBuffer | null {
		if (this._buffer.length) {
			return this._buffer;
		} else {
			return null;
		}
	}
	set buffer(buffer) {
		if (buffer) {
			this._buffer.set(buffer);
		}
		// if it's already got a buffer, create a new one
		if (this._convolver.buffer) {
			// disconnect the old one
			this.effectSend.disconnect();
			this._convolver.disconnect();
			// create and connect a new one
			this._convolver = this.context.createConvolver();
			this.connectEffect(this._convolver);
		}
		const buff = this._buffer.get();
		this._convolver.buffer = buff ? buff : null;
	}

	/**
	 * The normalize property of the ConvolverNode interface is a boolean that
	 * controls whether the impulse response from the buffer will be scaled by
	 * an equal-power normalization when the buffer attribute is set, or not.
	 */
	get normalize(): boolean {
		return this._convolver.normalize;
	}
	set normalize(norm) {
		this._convolver.normalize = norm;
	}

	dispose(): this {
		super.dispose();
		this._buffer.dispose();
		this._convolver.disconnect();
		return this;
	}
}
