import mongoose from 'mongoose'

// Reused across serverless invocations so we don't open a new
// connection to Atlas on every cold start.
let connectionPromise = null

export function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection)
  }
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI)
      .catch((err) => {
        connectionPromise = null
        throw err
      })
  }
  return connectionPromise
}

export function dbStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting']
  return states[mongoose.connection.readyState] ?? 'unknown'
}
