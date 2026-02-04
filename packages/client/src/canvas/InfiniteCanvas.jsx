import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Text, Transformer } from 'react-konva';
import useCanvasStore from '../store/canvasStore';

export const InfiniteCanvas = () => {
	const stageRef = useRef(null);
	const transformerRef = useRef(null);
	const elementRefs = useRef({});
	const layerRef = useRef(null);

	const [isPanning, setIsPanning] = useState(false);

	const [isSelecting, setIsSelecting] = useState(false);
	const [selectionBox, setSelectionBox] = useState(null);

	const [isShiftPressed, setIsShiftPressed] = useState(false);

	const {
		elements,
		scale,
		position,
		selectedIds,
		updateElement,
		selectElement,
		addToSelection,
		selectElements,
		clearSelection,
		setPosition,
		zoomToPoint,
	} = useCanvasStore();

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === 'Shift') setIsShiftPressed(true);
		};

		const handleKeyUp = (e) => {
			if (e.key === 'Shift') setIsShiftPressed(false);
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, []);

	useEffect(() => {
		const transformer = transformerRef.current;
		if (!transformer) return;

		const nodes = selectedIds.map((id) => elementRefs.current[id]).filter(Boolean);

		transformer.nodes(nodes);
		transformer.getLayer()?.batchDraw();
	}, [selectedIds, elements]);

	const handleWheel = (e) => {
		e.evt.preventDefault();
		const stage = stageRef.current;
		const pointer = stage.getPointerPosition();
		const direction = e.evt.deltaY > 0 ? -1 : 1;
		zoomToPoint(pointer, direction);
	};

	const handleMouseDown = (e) => {
		const stage = stageRef.current;
		const isClickOnEmpty = e.target === stage;

		if (e.evt.button === 2) {
			e.evt.preventDefault();
			setIsPanning(true);
			return;
		}

		if (e.evt.button === 0 && isClickOnEmpty) {
			const pointer = stage.getPointerPosition();
			const stagePos = { x: stage.x(), y: stage.y() };
			const stageScale = stage.scaleX();

			const canvasX = (pointer.x - stagePos.x) / stageScale;
			const canvasY = (pointer.y - stagePos.y) / stageScale;

			setIsSelecting(true);
			setSelectionBox({ startX: canvasX, startY: canvasY, x: canvasX, y: canvasY, width: 0, height: 0 });

			if (!e.evt.ctrlKey && !e.evt.metaKey) {
				clearSelection();
			}
		}
	};

	const handleMouseMove = (e) => {
		const stage = stageRef.current;

		if (isPanning) {
			stage.x(stage.x() + e.evt.movementX);
			stage.y(stage.y() + e.evt.movementY);
			return;
		}

		if (isSelecting && selectionBox) {
			const pointer = stage.getPointerPosition();
			const stagePos = { x: stage.x(), y: stage.y() };
			const stageScale = stage.scaleX();

			const canvasX = (pointer.x - stagePos.x) / stageScale;
			const canvasY = (pointer.y - stagePos.y) / stageScale;

			const newBox = {
				...selectionBox,
				x: Math.min(selectionBox.startX, canvasX),
				y: Math.min(selectionBox.startY, canvasY),
				width: Math.abs(canvasX - selectionBox.startX),
				height: Math.abs(canvasY - selectionBox.startY),
			};
			setSelectionBox(newBox);
		}
	};

	const handleMouseUp = (e) => {
		const stage = stageRef.current;

		if (isPanning) {
			setIsPanning(false);
			setPosition({ x: stage.x(), y: stage.y() });
			return;
		}

		if (isSelecting && selectionBox) {
			const selected = elements.filter((el) => {
				const node = elementRefs.current[el.id];
				if (!node) return false;

				const box = node.getClientRect({ relativeTo: layerRef.current });

				return (
					box.x < selectionBox.x + selectionBox.width &&
					box.y < selectionBox.y + selectionBox.height &&
					box.x + box.width > selectionBox.x &&
					box.y + box.height > selectionBox.y
				);
			});

			if (selected.length > 0) {
				const ids = selected.map((el) => el.id);
				if (e.evt.ctrlKey || e.evt.metaKey) {
					const newIds = [...new Set([...selectedIds, ...ids])];
					selectElements(newIds);
				} else {
					selectElements(ids);
				}
			}
			setIsSelecting(false);
			setSelectionBox(null);
		}
	};

	const handleContextMenu = (e) => {
		e.evt.preventDefault();
	};

	const handleElementClick = (id, e) => {
		e.cancelBubble = true;

		if (e.evt.ctrlKey || e.evt.metaKey) {
			addToSelection(id);
		} else {
			selectElement(id);
		}
	};

	const handleElementDragEnd = (id, e) => {
		const node = e.target;
		updateElement(id, { x: node.x(), y: node.y() });
	};

	const handleTransformEnd = () => {
		selectedIds.forEach((id) => {
			const node = elementRefs.current[id];
			if (!node) return;

			updateElement(id, {
				x: node.x(),
				y: node.y(),
				rotation: node.rotation(),
				scaleX: node.scaleX(),
				scaleY: node.scaleY(),
			});
		});
	};

	const renderElement = (el) => {
		const shadowProps = {
			shadowColor: 'black',
			shadowBlur: 10,
			shadowOpacity: 0.2,
			shadowOffset: { x: 2, y: 2 },
		};

		const commonProps = {
			ref: (node) => {
				elementRefs.current[el.id] = node;
			},
			x: el.x,
			y: el.y,
			rotation: el.rotation || 0,
			scaleX: el.scaleX || 1,
			scaleY: el.scaleY || 1,
			draggable: true,
			onClick: (e) => handleElementClick(el.id, e),
			onDragEnd: (e) => handleElementDragEnd(el.id, e),
		};

		switch (el.type) {
			case 'rect':
				return (
					<Rect
						key={el.id}
						width={el.width}
						height={el.height}
						fill={el.fill}
						cornerRadius={4}
						{...shadowProps}
						{...commonProps}
					/>
				);
			case 'circle':
				return <Circle key={el.id} radius={el.radius} fill={el.fill} {...shadowProps} {...commonProps} />;
			case 'text':
				return <Text key={el.id} text={el.text} fontSize={el.fontSize} fill={el.fill} {...commonProps} />;
			default:
				return null;
		}
	};

	const getCursor = () => {
		if (isPanning) return 'grabbing';
		if (isSelecting) return 'crosshair';
		return 'default';
	};

	return (
		<Stage
			ref={stageRef}
			width={window.innerWidth}
			height={window.innerHeight}
			scaleX={scale}
			scaleY={scale}
			x={position.x}
			y={position.y}
			onWheel={handleWheel}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onContextMenu={handleContextMenu}
			style={{ backgroundColor: '#f5f5f5', cursor: getCursor() }}
		>
			<Layer ref={layerRef}>
				{elements.map(renderElement)}

				{isSelecting && selectionBox && (
					<Rect
						x={selectionBox.x}
						y={selectionBox.y}
						width={selectionBox.width}
						height={selectionBox.height}
						fill="rgba(59, 130, 246, 0.2)"
						stroke="#3b82f6"
						strokeWidth={1}
						dash={[4, 4]}
						listening={false}
					/>
				)}
				<Transformer
					ref={transformerRef}
					borderStroke="#0ea5e9"
					borderStrokeWidth={1.5}
					anchorFill="white"
					anchorStroke="#0ea5e9"
					anchorStrokeWidth={1.5}
					anchorSize={8}
					anchorCornerRadius={2}
					rotateEnabled={true}
					rotationSnaps={isShiftPressed ? [0, 45, 90, 135, 180, 225, 270, 315] : []}
					rotateAnchorOffset={20}
					keepRatio={isShiftPressed}
					enabledAnchors={[
						'top-left',
						'top-center',
						'top-right',
						'middle-left',
						'middle-right',
						'bottom-left',
						'bottom-center',
						'bottom-right',
					]}
					boundBoxFunc={(oldBox, newBox) => {
						if (newBox.width < 10 || newBox.height < 10) {
							return oldBox;
						}
						return newBox;
					}}
					onTransformEnd={handleTransformEnd}
				/>
			</Layer>
		</Stage>
	);
};
