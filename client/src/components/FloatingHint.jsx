import React, { useRef, useState } from 'react';
import {
  arrow,
  flip,
  FloatingArrow,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole
} from '@floating-ui/react';

const FloatingHint = ({
  children,
  content,
  placement = 'top',
  strategy = 'absolute'
}) => {
  const [open, setOpen] = useState(false);
  const arrowRef = useRef(null);
  const {
    context,
    floatingStyles,
    refs
  } = useFloating({
    middleware: [
      offset(12),
      flip(),
      shift({ padding: 10 }),
      arrow({ element: arrowRef })
    ],
    onOpenChange: setOpen,
    open,
    placement,
    strategy
  });

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });
  const { getFloatingProps, getReferenceProps } = useInteractions([hover, focus, dismiss, role]);

  return (
    <>
      <span
        ref={refs.setReference}
        {...getReferenceProps()}
        className="floating-reference"
      >
        {children}
      </span>
      {open && content && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="floating-hint"
          >
            <FloatingArrow ref={arrowRef} context={context} className="floating-arrow" fill="#0f172a" />
            <div className="floating-hint-content">{content}</div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

export default FloatingHint;
