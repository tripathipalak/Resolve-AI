import { motion } from 'framer-motion';

// Every page fades and slides in; AnimatePresence in App plays the exit animation.
export default function Page({ children }) {
  return (
    <motion.main
      className="page"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.main>
  );
}
