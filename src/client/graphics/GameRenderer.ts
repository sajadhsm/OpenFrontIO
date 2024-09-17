import {Game} from "../../core/Game";
import {NameLayer} from "./layers/NameLayer";
import {TerrainLayer} from "./layers/TerrainLayer";
import {TerritoryLayer} from "./layers/TerritoryLayer";
import {ClientID} from "../../core/Schemas";
import {createCanvas} from "./Utils";
import {UILayer} from "./layers/UILayer";
import {EventBus} from "../../core/EventBus";
import {TransformHandler} from "./TransformHandler";
import {Layer} from "./layers/Layer";


export function createRenderer(game: Game, eventBus: EventBus, clientID: ClientID): GameRenderer {
	const canvas = createCanvas()
	const transformHandler = new TransformHandler(game, eventBus, canvas)

	const layers: Layer[] = [
		new TerrainLayer(game),
		new TerritoryLayer(game, eventBus),
		new NameLayer(game, game.config().theme(), transformHandler),
		new UILayer(eventBus, game, game.config().theme(), clientID, transformHandler)
	]

	return new GameRenderer(game, eventBus, canvas, transformHandler, layers)
}


export class GameRenderer {

	private context: CanvasRenderingContext2D

	constructor(private game: Game, private eventBus: EventBus, private canvas: HTMLCanvasElement, public transformHandler: TransformHandler, private layers: Layer[]) {
		this.context = canvas.getContext("2d")
	}

	initialize() {
		this.layers.forEach(l => l.init())

		document.body.appendChild(this.canvas);
		window.addEventListener('resize', () => this.resizeCanvas());
		this.resizeCanvas();

		this.transformHandler = new TransformHandler(this.game, this.eventBus, this.canvas)

		requestAnimationFrame(() => this.renderGame());
	}

	resizeCanvas() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		//this.redraw()
	}

	renderGame() {
		// Set background
		this.context.fillStyle = this.game.config().theme().backgroundColor().toHex();
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

		// Save the current context state
		this.context.save();

		this.transformHandler.handleTransform(this.context)

		this.layers.forEach(l => {
			if (l.shouldTransform()) {
				l.render(this.context)
			}
		})

		this.context.restore()

		this.layers.forEach(l => {
			if (!l.shouldTransform()) {
				l.render(this.context)
			}
		})

		requestAnimationFrame(() => this.renderGame());
	}

	tick() {
		this.layers.forEach(l => l.tick())
	}

	resize(width: number, height: number): void {
		this.canvas.width = Math.ceil(width / window.devicePixelRatio);
		this.canvas.height = Math.ceil(height / window.devicePixelRatio);
	}

}