import { Gain } from "../../core/context/Gain";
import { optionsFromArguments } from "../../core/util/Defaults";
import { Envelope, EnvelopeOptions } from "./Envelope";

/**
 * AmplitudeEnvelope is a Tone.Envelope connected to a gain node.
 * Unlike Tone.Envelope, which outputs the envelope's value, AmplitudeEnvelope accepts
 * an audio signal as the input and will apply the envelope to the amplitude
 * of the signal.
 * Read more about ADSR Envelopes on [Wikipedia](https://en.wikipedia.org/wiki/Synthesizer#ADSR_envelope).
 *
 * @param attack The amount of time it takes for the envelope to go from 0 to it's maximum value.
 * @param decay	The period of time after the attack that it takes for the envelope
 *                       	to fall to the sustain value. Value must be greater than 0.
 * @param sustain	The percent of the maximum value that the envelope rests at until
 *                                	the release is triggered.
 * @param release	The amount of time after the release is triggered it takes to reach 0.
 *                         	Value must be greater than 0.
 *  @example
 * var ampEnv = new AmplitudeEnvelope({
 * 	"attack": 0.1,
 * 	"decay": 0.2,
 * 	"sustain": 1.0,
 * 	"release": 0.8
 * }).toMaster();
 * //create an oscillator and connect it
 * var osc = new Tone.Oscillator().connect(ampEnv).start();
 * //trigger the envelopes attack and release "8t" apart
 * ampEnv.triggerAttackRelease("8t");
 */
export class AmplitudeEnvelope extends Envelope {

	private _gainNode: Gain = new Gain({
		context: this.context,
		gain: 0,
	});
	output: Gain = this._gainNode;
	input: Gain = this._gainNode;

	constructor(attack?: Time, decay?: Time, sustain?: NormalRange, release?: Time);
	constructor(options?: Partial<EnvelopeOptions>)
	constructor() {
		super(optionsFromArguments(AmplitudeEnvelope.getDefaults(), arguments, ["attack", "decay", "sustain", "release"]));
		this._sig.connect(this._gainNode.gain);
		this.output = this._gainNode;
		this.input = this._gainNode;
	}

	/**
	 * Clean up
	 */
	dispose(): this {
		super.dispose();
		this._gainNode.dispose();
		return this;
	}
}
