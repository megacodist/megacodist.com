//
// 
//

declare module '@utils/msgs.json' {
   const MSGS: MsgTypes;

   export default MSGS;

   export interface MsgTypes {
      errors: Errors;
   }
     
     export interface Errors {
      outdatedBrowser: string;
      errTryLater: string;
      privateClassFieldsErr: string;
   }
}
