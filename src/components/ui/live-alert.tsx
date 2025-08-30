import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"
import React from "react"

interface LiveAlertProps {
  message: string
  type: "success" | "error" | null
}

export function LiveAlert({ message, type }: LiveAlertProps) {
  const [fm, setFm] = React.useState<any>(null)

  React.useEffect(() => {
    import("framer-motion").then(setFm)
  }, [])

  if (!fm) return null

  const { AnimatePresence, motion } = fm

  return (
    <AnimatePresence>
      {type && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Alert
            variant={type === "error" ? "destructive" : "default"}
            aria-live={type === "error" ? "assertive" : "polite"}
          >
            {type === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
