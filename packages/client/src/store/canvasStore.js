import { create } from 'zustand';

const initialElements = [
	{ id: '1', type: 'rect', x: 100, y: 100, width: 100, height: 80, fill: 'red' },
	{ id: '2', type: 'circle', x: 200, y: 200, radius: 50, fill: 'blue' },
	{ id: '3', type: 'text', x: 300, y: 300, text: 'Hello, world!', fontSize: 20, fill: 'green' },
];

const useCanvasStore = create((set, get) => ({
	elements: initialElements,
	scale: 1,
	position: { x: 0, y: 0 },
	selectedId: null,

	addElement: (element) =>
		set((state) => ({
			elements: [...state.elements, { ...element, id: crypto.randomUUID() }],
		})),

	updateElement: (id, updates) =>
		set((state) => ({
			elements: state.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
		})),

	deleteElement: (id) =>
		set((state) => ({
			elements: state.elements.filter((el) => el.id !== id),
			selectedId: state.selectedId === id ? null : state.selectedId,
		})),

	selectElement: (id) => set({ selectedId: id }),

	clearSelection: () => set({ selectedId: null }),

	setScale: (scale) => set({ scale: Math.max(0.1, Math.min(5, scale)) }),

	setPosition: (position) => set({ position }),

	zoomToPoint: (pointer, direction) => {
		const { scale, position } = get();
		const scaleBy = 1.1;
		const newScale = direction > 0 ? scale * scaleBy : scale / scaleBy;
		const clampedScale = Math.max(0.1, Math.min(5, newScale));

		const mousePointTo = {
			x: (pointer.x - position.x) / scale,
			y: (pointer.y - position.y) / scale,
		};

		const newPos = {
			x: pointer.x - mousePointTo.x * clampedScale,
			y: pointer.y - mousePointTo.y * clampedScale,
		};

		set({ scale: clampedScale, position: newPos });
	},
}));

export default useCanvasStore;
