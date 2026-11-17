"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

export interface RevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  className?: string;
  immediate?: boolean;
}

const easeCurve = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  delay = 0,
  duration = 0.35,
  yOffset = 14,
  className,
  immediate = false,
  ...props
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const prefersReduced = mounted && Boolean(shouldReduceMotion);

  // Motion expects delay in seconds. If a number >= 5 was passed, it was intended as milliseconds (e.g. 50, 150).
  // Automatically normalize and clamp to a maximum of 0.25s so content never gets stuck invisible.
  const normalizedDelay = delay >= 5 ? delay / 1000 : delay;
  const safeDelay = Math.min(Math.max(normalizedDelay, 0), 0.25);

  const normalizedDuration = duration >= 5 ? duration / 1000 : duration;
  const safeDuration = Math.min(Math.max(normalizedDuration, 0.1), 0.5);

  if (immediate) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: prefersReduced ? 0 : yOffset,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{ once: true, margin: "0px", amount: 0.02 }}
      transition={{
        duration: prefersReduced ? 0.15 : safeDuration,
        delay: prefersReduced ? 0 : safeDelay,
        ease: easeCurve,
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export interface RevealGroupProps extends HTMLMotionProps<"div"> {
  stagger?: number;
  children: React.ReactNode;
}

export function RevealGroup({
  stagger = 0.06,
  children,
  className,
  ...props
}: RevealGroupProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const prefersReduced = mounted && Boolean(shouldReduceMotion);

  const normalizedStagger = stagger >= 5 ? stagger / 1000 : stagger;
  const safeStagger = Math.min(Math.max(normalizedStagger, 0), 0.1);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReduced ? 0 : safeStagger,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: prefersReduced ? 0 : 14,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReduced ? 0.15 : 0.35,
        ease: easeCurve,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px", amount: 0.02 }}
      className={cn(className)}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return (
          <motion.div variants={itemVariants} className="w-full">
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
