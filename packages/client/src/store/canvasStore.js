import { create } from 'zustand';

const initialElements = [
	{
		id: '1',
		type: 'rect',
		x: 100,
		y: 100,
		width: 100,
		height: 80,
		fill: '#ef4444',
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
	},
	{
		id: '2',
		type: 'circle',
		x: 300,
		y: 150,
		radius: 50,
		fill: '#3b82f6',
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
	},
	{
		id: '3',
		type: 'text',
		x: 150,
		y: 300,
		text: 'Hello BoardCraft!',
		fontSize: 24,
		fill: '#333',
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
	},
];

const useCanvasStore = create((set, get) => ({
	elements: initialElements,
	scale: 1,
	position: { x: 0, y: 0 },
	selectedIds: [],

	addElement: (element) =>
		set((state) => ({
			elements: [
				...state.elements,
				{
					...element,
					id: crypto.randomUUID(),
					rotation: element.rotation || 0,
					scaleX: element.scaleX || 1,
					scaleY: element.scaleY || 1,
				},
			],
		})),

	updateElement: (id, updates) =>
		set((state) => ({
			elements: state.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
		})),

	deleteElement: (id) =>
		set((state) => ({
			elements: state.elements.filter((el) => el.id !== id),
			selectedIds: state.selectedIds.filter((sid) => sid !== id),
		})),

	selectElement: (id) => set({ selectedIds: [id] }),

	setElements: (elements) => set({ elements }),

	addToSelection: (id) =>
		set((state) => ({
			selectedIds: state.selectedIds.includes(id)
				? state.selectedIds.filter((sid) => sid !== id)
				: [...state.selectedIds, id],
		})),

	selectElements: (ids) => set({ selectedIds: ids }),

	clearSelection: () => set({ selectedIds: [] }),

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
