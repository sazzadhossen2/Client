import React from 'react'
import UserSubmitButton from './UserSubmitButton.jsx';
import { useNavigate } from 'react-router-dom';
import UserStore from '../../store/UserStore.js';
import ValidationHelper from '../../utility/ValidationHelper.js';
import toast from 'react-hot-toast'

function OtpForm() {

  
  const {OTPFormData, OTPFormONChange,VerifyLoginRequest}=UserStore();
  let navigator =useNavigate();
  const onFromSubit=async()=>{
    if(ValidationHelper.IsEmpty(OTPFormData.otp)){
  toast.error("Please enter OTP");
    }else{
      let res =await VerifyLoginRequest(OTPFormData.otp);
      res ?navigator('/'):toast.error("Invalid OTP");
    }
  }
  return (
 <div className="container section">  
<div className="row d-flex justify-content-center">  
<div className="col-md-5">  
<div className="card p-5">  
<h4>Enter Verification Code</h4>  
<p>A verification code has been sent to the email address you provide</p>  
<input
value={OTPFormData.otp}
onChange={(e)=>OTPFormONChange("otp",e.target.value)}
placeholder="Verification" type="text" className="form-control"/>  
<UserSubmitButton
//  submit={false} 
onClick={onFromSubit}
 className="btn mt-3 btn-success" text="Submit"/>  
</div>  
</div>  
</div>  
</div>
  )
}

export default OtpForm;