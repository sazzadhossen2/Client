import React from 'react'
import UserStore from '../../store/UserStore'

function UserSubmitButton(props) {
  const{isFormSubmit}=UserStore();
  if(isFormSubmit===false){
return <button onClick={props.onClick} type='submit' className={props.className}>{props.text}</button>
  }else{
return <button onClick={props.onClick} type='submit' className={props.className}><div className='spinner-border spinner-border-sm'></div> Processing...</button>
  }
 
}

export default UserSubmitButton