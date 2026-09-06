import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host:'0.0.0.0',
    port:1409,
    allowedHosts:true,
    // proxy: {
    //   '/api': 'http://localhost:7000/apbus/api/v1'
    // }
  }
})




// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],

//   server: {
//     port: 5000,
//     host: '0.0.0.0',
//     allowedHosts: [
//       'apsts.netcreativemind.com'
//     ]
//   }
// })