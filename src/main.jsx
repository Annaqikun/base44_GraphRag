import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from '../Layout'
import { Routes, Route } from 'react-router-dom'
import Dashboard from '../Pages/Dashboard'
import Upload from '../Pages/Upload'
import Graph from '../Pages/Graph'
import Chat from '../Pages/Chat'
import './styles.css'

const queryClient = new QueryClient()

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/graph" element={<Graph />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
