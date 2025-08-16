import axios from 'axios';
import { create } from 'zustand';
import Cookies from 'js-cookie';
const UserProfile = create((set, get)=>({
isFormSubmit: false,



 authCfg: () => ({
    withCredentials: true,                             
  
     headers: { Authorization: `Bearer ${Cookies.get('token') || ''}` }    
  }),

ProfileFormData: {
    cus_add: "",
    cus_city: "",
    cus_state: "",
    cus_country: "",
    cus_fax: "",
    cus_phone: "",
    cus_postcode: "",
    cus_name: "",

    ship_add: "",
    ship_city: "",
    ship_state: "",
    ship_country: "",
    ship_phone: "",
    ship_postcode: "",
    ship_name: "",
  },





  ProfileFormOnChange: (name, value) => {  
    set((state) => ({
      ProfileFormData: {
        ...state.ProfileFormData,
        [name]: value
      }
    }));
  },


ProfileData:null,
ReadProfileRequest:async()=>{
  const res = await axios.get('/api/v1/ReadProfile', get().authCfg());
  console.log('ReadProfileResponse:', res.data);
  if(res.data['status']==='Success'){
    console.log('ProfileData:', res.data['data']);
    set({ProfileData: res.data['data'] })
  }
},






CreateProfileRequest:async()=>{
  set({isFormSubmit:true});
  let res =await axios.post('/api/v1/CreateProfile', get().ProfileFormData,get().authCfg());
  set({isFormSubmit:false});
  return res.data['status'] === 'Success' ;
},


UpdateProfileRequest:async()=>{
  set({isFormSubmit:true});
  let res =await axios.put('/api/v1/UpdateProfile', get().ProfileFormData,get().authCfg());
  set({isFormSubmit:false});
  return res.data['status'] === 'Success' ;
}

}))


export default UserProfile;


