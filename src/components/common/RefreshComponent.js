import React, { useEffect } from "react";
import useAppIsInForeground from "../../hooks/useAppIsInForeground";


const RefreshComponent = ({methodToCall}) => {
    const appIsInForeground = useAppIsInForeground();
  
    useEffect(()=> {
    if(appIsInForeground) {
       //Do something E.g. Refetch data
       console.log("doo something");
       methodToCall();
    }
    }, [appIsInForeground]);

    return <></>
  
  }

  export default RefreshComponent