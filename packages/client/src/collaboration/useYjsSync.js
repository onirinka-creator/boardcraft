import { useEffect, useCallback, useRef } from 'react';
import { elementsMap, connectToRoom } from './yjsProvider';
import useCanvasStore from '../store/canvasStore';

export function useYjsSync(roomName = 'default') {
	const { elements, setElements } = useCanvasStore();
	const isInitialiazed = useRef(false);

	useEffect(() => {
		console.log(`Yjs Connecting to room: ${roomName}`);
		connectToRoom(roomName);

		const handleYjsChange = () => {
			const yjsElements = [];
			elementsMap.forEach((value, key) => {
				yjsElements.push({ ...value, id: key });
			});

			if (yjsElements.length > 0) {
				setElements(yjsElements);
			}
		};

		elementsMap.observe(handleYjsChange);

		const initTimeout = setTimeout(() => {
			if (!isInitialiazed.current && elementsMap.size === 0) {
				console.log('Yjs Initializing with elements (local)');
				elements.forEach((el) => {
					elementsMap.set(el.id, el);
				});
				isInitialiazed.current = true;
			} else if (elementsMap.size > 0) {
				handleYjsChange();
				isInitialiazed.current = true;
			}
		}, 500);

		return () => {
			clearTimeout(initTimeout);
			elementsMap.unobserve(handleYjsChange);
		};
	}, [roomName]);

	const syncElement = useCallback((id, data) => {
		elementsMap.set(id, { ...data, id });
	}, []);

	const addSyncedElement = useCallback((element) => {
		const id = element.id || crypto.randomUUID();
		const newElement = { ...element, id };
		elementsMap.set(id, newElement);
		return newElement;
	}, []);

	const removeSyncedElement = useCallback((id) => {
		elementsMap.delete(id);
	}, []);

	return {
		syncElement,
		addSyncedElement,
		removeSyncedElement,
	};
}
