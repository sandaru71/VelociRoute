import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
    authorizationEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token'
}

const config = {
    clientId: 'e54e5f76f16449be8812f06600f564a1',
    scopes: [
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing',
        'streaming',
        'app-remote-control'
    ],
    usePKCE: true,
    redirectUri: makeRedirectUri({
        scheme: 'velociroute',
    })
};

export const useSpotifyAuth = () => {
    const [request, response, promptAsync] = useAuthRequest(
        {
            clientId: config.clientId,
            scopes: config.scopes,
            redirectUri: config.redirectUri,
        },
        discovery
    );

    return{
        request,
        response,
        promptAsync
    };
};

