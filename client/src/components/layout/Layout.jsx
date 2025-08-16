import React from 'react'

import Footer from './Footer'
import NavBar from '../layout/NavBar'
import { Toaster } from 'react-hot-toast'



function Layout({children}) {
  return (
    <>
   
   <NavBar/>
{children}
<Toaster position='top-center'></Toaster>
   <Footer/>
    
    </>
  )
}

export default Layout