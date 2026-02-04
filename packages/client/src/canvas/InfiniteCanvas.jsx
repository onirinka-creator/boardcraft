import { useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group } from 'react-konva';
import useCanvasStore from '../store/canvasStore';

export const InfiniteCanvas = () => {
	const stageRef = useRef(null);
	const [isDraggingState, setIsDraggingState] = useState(false);

	const {
		elements,
		scale,
		position,
		selectedId,
		updateElement,
		selectElement,
		clearSelection,
		setPosition,
		zoomToPoint,
	} = useCanvasStore();

	const handleMouseWheel = (e) => {
		e.evt.preventDefault();
		const stage = stageRef.current;
		const pointer = stage.getPointerPosition();
		const direction = e.evt.deltaY > 0 ? -1 : 1;
		zoomToPoint(pointer, direction);
	};

	const handleDragStart = (e) => {
		if (e.target === stageRef.current) {
			setIsDraggingState(true);
		}
	};

	const handleDragEnd = (e) => {
		if (e.target === stageRef.current) {
			setIsDraggingState(false);
			setPosition({ x: e.target.x(), y: e.target.y() });
		}
	};

	const handleElementDragEnd = (id, e) => {
		updateElement(id, { x: e.target.x(), y: e.target.y() });
	};

	const handleElementClick = (id, e) => {
		e.cancelBubble = true;
		selectElement(id);
	};

	const handleStageClick = (e) => {
		if (e.target === stageRef.current) {
			clearSelection();
		}
	};

	const renderSelection = (el) => {
		const padding = 6;

		if (el.type === 'rect') {
			return (
				<>
					<Rect
						x={-padding}
						y={-padding}
						width={el.width + padding * 2}
						height={el.height + padding * 2}
						fill="rgba(59, 130, 246, 0.2)"
						cornerRadius={6}
					/>
					<Rect
						x={-padding}
						y={-padding}
						width={el.width + padding * 2}
						height={el.height + padding * 2}
						stroke="#3b82f6"
						strokeWidth={2}
						cornerRadius={6}
						dash={[6, 3]}
					/>
				</>
			);
		}

		if (el.type === 'circle') {
			return (
				<>
					<Circle x={0} y={0} radius={el.radius + padding} fill="rgba(59, 130, 246, 0.2)" />
					<Circle x={0} y={0} radius={el.radius + padding} stroke="#3b82f6" strokeWidth={2} dash={[6, 3]} />
				</>
			);
		}

		if (el.type === 'text') {
			const approxWidth = el.text.length * el.fontSize * 0.6;
			const approxHeight = el.fontSize * 1.2;
			return (
				<>
					<Rect
						x={-padding}
						y={-padding}
						width={approxWidth + padding * 2}
						height={approxHeight + padding * 2}
						fill="rgba(59, 130, 246, 0.2)"
						cornerRadius={4}
					/>
					<Rect
						x={-padding}
						y={-padding}
						width={approxWidth + padding * 2}
						height={approxHeight + padding * 2}
						stroke="#3b82f6"
						strokeWidth={2}
						cornerRadius={4}
						dash={[6, 3]}
					/>
				</>
			);
		}

		return null;
	};

	const renderElement = (el) => {
		const isSelected = el.id === selectedId;

		const commonHandlers = {
			onClick: (e) => handleElementClick(el.id, e),
			onDragEnd: (e) => handleElementDragEnd(el.id, e),
		};

		const shadowProps = {
			shadowColor: 'black',
			shadowBlur: 10,
			shadowOpacity: 0.2,
			shadowOffset: { x: 2, y: 2 },
		};

		return (
			<Group key={el.id} x={el.x} y={el.y} draggable {...commonHandlers}>
				{isSelected && renderSelection(el)}

				{el.type === 'rect' && (
					<Rect width={el.width} height={el.height} fill={el.fill} cornerRadius={4} {...shadowProps} />
				)}
				{el.type === 'circle' && <Circle radius={el.radius} fill={el.fill} {...shadowProps} />}
				{el.type === 'text' && <Text text={el.text} fontSize={el.fontSize} fill={el.fill} />}
			</Group>
		);
	};

	const getCursor = () => {
		if (isDraggingState) return 'grabbing';
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
			draggable
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onWheel={handleMouseWheel}
			onClick={handleStageClick}
			style={{ backgroundColor: '#f5f5f5', cursor: getCursor() }}
		>
			<Layer>{elements.map(renderElement)}</Layer>
		</Stage>
	);
};
