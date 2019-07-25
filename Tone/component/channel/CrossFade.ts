import { Gain } from "../../core/context/Gain";
import { connect, ToneAudioNode, ToneAudioNodeOptions } from "../../core/context/ToneAudioNode";
import { optionsFromArguments } from "../../core/util/Defaults";
import { readOnly } from "../../core/util/Interface";
import { GainToAudio } from "../../signal/GainToAudio";
import { Signal } from "../../signal/Signal";

interface CrossFadeOptions extends ToneAudioNodeOptions {
	fade: NormalRange;
}

/**
 * Tone.Crossfade provides equal power fading between two inputs.
 * More on crossfading technique [here](https://en.wikipedia.org/wiki/Fade_(audio_engineering)#Crossfading).
 * ```
 *                                             +---------+
 *                                            +> input a +>--+
 * +-----------+   +---------------------+     |         |   |
 * | 1s signal +>--> stereoPannerNode  L +>----> gain    |   |
 * +-----------+   |                     |     +---------+   |
 *               +-> pan               R +>-+                |   +--------+
 *               | +---------------------+  |                +---> output +>
 *  +------+     |                          |  +---------+   |   +--------+
 *  | fade +>----+                          | +> input b +>--+
 *  +------+                                |  |         |
 *                                          +--> gain    |
 *                                             +---------+
 * ```
 * @example
 * var crossFade = new CrossFade(0.5);
 * //connect effect A to crossfade from
 * //effect output 0 to crossfade input 0
 * effectA.connect(crossFade.a);
 * //connect effect B to crossfade from
 * //effect output 0 to crossfade input 1
 * effectB.connect(crossFade.b);
 * crossFade.fade.value = 0;
 * // ^ only effectA is output
 * crossFade.fade.value = 1;
 * // ^ only effectB is output
 * crossFade.fade.value = 0.5;
 * // ^ the two signals are mixed equally.
 */
export class CrossFade extends ToneAudioNode<CrossFadeOptions> {

	name = "CrossFade";

	/**
	 * The crossfading is done by a StereoPannerNode
	 */
	private _panner: StereoPannerNode = this.context.createStereoPanner();

	/**
	 * Split the output of the panner node into two values used to control the gains.
	 */
	private _split: ChannelSplitterNode = this.context.createChannelSplitter(2);

	/**
	 * Convert the fade value into an audio range value so it can be connected
	 * to the panner.pan AudioParam
	 */
	private _g2a: GainToAudio = new GainToAudio({ context : this.context });

	/**
	 * The input which is at full level when fade = 0
	 */
	a: Gain = new Gain({
		context : this.context,
		gain: 0,
	});

	/**
	 * The input which is at full level when fade = 1
	 */
	b: Gain = new Gain({
		context : this.context,
		gain: 0,
	});

	/**
	 * The output is a mix between `a` and `b` at the ratio of `fade`
	 */
	output: Gain = new Gain({ context : this.context });

	/**
	 * CrossFade has no input, you must choose either `a` or `b`
	 */
	input: undefined;

	/**
	 * 	The mix between the two inputs. A fade value of 0
	 * 	will output 100% crossFade.a and
	 * 	a value of 1 will output 100% crossFade.b.
	 */
	readonly fade: Signal<NormalRange>;

	protected _internalChannels = [this.a, this.b];

	constructor(options?: Partial<CrossFadeOptions>);
	// tslint:disable-next-line: unified-signatures
	constructor(fade?: NormalRange);
	constructor() {
		super(Object.assign(optionsFromArguments(CrossFade.getDefaults(), arguments, ["fade"])));
		const options = optionsFromArguments(CrossFade.getDefaults(), arguments, ["fade"]);

		this.fade = new Signal({
			context: this.context,
			units: "normalRange",
			value: options.fade,
		});
		readOnly(this, "fade");

		this.context.getConstant(1).connect(this._panner);
		this._panner.connect(this._split);
		connect(this._split, this.a.gain, 0);
		connect(this._split, this.b.gain, 1);

		this.fade.chain(this._g2a, this._panner.pan);

		this.a.connect(this.output);
		this.b.connect(this.output);
	}

	static getDefaults(): CrossFadeOptions {
		return Object.assign(ToneAudioNode.getDefaults(), {
			fade: 0.5,
		});
	}

	dispose(): this {
		super.dispose();
		this.a.dispose();
		this.b.dispose();
		this.output.dispose();
		this.fade.dispose();
		this._g2a.dispose();
		this._panner.disconnect();
		this._split.disconnect();
		return this;
	}
}
