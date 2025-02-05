import { AntDesign, Feather } from "@expo/vector-icons";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export const icons = {
    index: (props)=> <AntDesign name="home" size={26} {...props} />,
    planner: (props)=> <FontAwesome5 name="route" size={26} {...props} />,
    record: (props)=> <MaterialCommunityIcons name="record-circle-outline" size={26} {...props} />,
    feed: (props)=> <MaterialIcons name="explore" size={26} {...props} />,
    profile: (props)=> <AntDesign name="user" size={26} {...props} />,
}