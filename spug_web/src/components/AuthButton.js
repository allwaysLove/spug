import React from 'react';
import { Button } from 'antd';
import { hasPermission } from "../libs";


export default function AuthButton(props) {
  let disabled = props.disabled;
  if (props.auth && !hasPermission(props.auth)) {
    disabled = true;
  }
  return <Button {...props} disabled={disabled}>{props.children}</Button>
}