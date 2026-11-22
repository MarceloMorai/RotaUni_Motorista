import type { PropsWithChildren } from 'react'; import { View } from 'react-native';
export function AppShell({ children }: PropsWithChildren) { return <View style={{flex:1,backgroundColor:'#15171C',alignItems:'center'}}><View style={{flex:1,width:'100%',maxWidth:430,borderLeftWidth:1,borderRightWidth:1,borderColor:'#3A3F4B',backgroundColor:'#F5F7FB'}}>{children}</View></View>; }
