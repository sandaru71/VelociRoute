import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { useEffect, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
    authorizationEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token'
}

const config = {
    clientId: 'e54e5f76f16449be8812f06600f564a1',
    scopes: [
        'user-read-private', 
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing',
        'streaming',
        'app-remote-control',
        'playlist-read-private',
        'playlist-read-collaborative'
    ],
    usePKCE: true,
    redirectUri: 'exp://10.64.231.196:8081/--/(app)/(tabs)/record'
};

console.log('Generated Redirect URI:', config.redirectUri);
console.log('Full Redirect URI:', config.redirectUri);
console.log('Development URI:', makeRedirectUri({
    scheme: 'exp',
    path: '--/(app)/(tabs)/record',
    host: '10.64.231.196:8081'
}));

const checkPremium = async (access_token) => {
    try{
        console.log('Checking premium status with token:', access_token);

        const response = await fetch('https://api.spotify.com/v1/me',{
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });
        const responseText = await response.text();
        console.log('Premium check API response:', {
            status: response.status,
            statusText: response.statusText,
            responseText: responseText.substring(0, 100) + '...'
        });

        if(!response.ok){
            console.error('Premium check failed', responseText);
            return null;
        }

        const data = JSON.parse(responseText);
        console.log('User profile data:', {
            id: data.id,
            product: data.product,
            type: data.type,
            country: data.country
        });
        return data.product === 'premium'; 
    }catch (error){
        console.error('Error in premium check:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        return null;
    }
};

const exchangeCodeForToken = async (code, codeVerifier) => {
    try{
        console.log('Starting token exchange:', {
            hasCode: !!code,
            hasVerifier: !!codeVerifier,
            redirectUri: config.redirectUri
        });

        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: config.redirectUri,
            client_id: config.clientId,
            code_verifier: codeVerifier
        });

        const response = await fetch(discovery.tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        })

        const responseText = await response.text();
        if (!response.ok) {
            console.error('Token exchange failed:', {
                status: response.status,
                response: responseText
            });
            return null;
        }

        const tokenData = JSON.parse(responseText);
        console.log('Token data received:', tokenData);
        return tokenData;
    }catch (error){
        console.error('Error in token exchange:', error);
        return null;
    }
};

export const useSpotifyAuth = () => {
    const [authResponse, setAuthResponse] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [premiumStatus, setPremiumStatus] = useState(null);
    const [request, response, promptAsync] = useAuthRequest(
        {
            clientId: config.clientId,
            scopes: config.scopes,
            redirectUri: config.redirectUri,
            usePKCE: true,
        },
        discovery
    );

    useEffect(() => {
        const handleAuthResponse = async () => {
            console.log('Response Changed:', {
                type: response?.type,
                hasCode: !!response?.params?.code,
                hasError: !!response?.error,
                hasVerifier: !!request?.codeVerifier
            });
    
            if(response?.type === 'success' && response.params.code){
                console.log('Auth code received:', response.params.code);
    
                if(!request?.codeVerifier){
                    console.error('No code verifier found');
                    return;
                }

                try{
                    const tokenData = await exchangeCodeForToken(response.params.code, request.codeVerifier);
                    console.log('Token exchange result:', {
                        success: !!tokenData,
                        hasAccessToken: !!tokenData?.access_token,
                        tokenType: tokenData?.token_type,
                        expiresIn: tokenData?.expires_in
                    });

                    if (tokenData?.access_token){
                        console.log('setting auth response with token data.')
                        setAuthResponse({
                            type: 'success',
                            params: tokenData
                        });
                    }else{
                        console.error('Token exchange failed. No access token in response.');
                    }
                }catch (error){
                    console.error('Error in token exchange:', error);
                }
            }else if (response?.type === 'error') {
                console.error('Auth error:', response.error);
            }
        };
        handleAuthResponse();
    }, [response, request?.codeVerifier]);

    useEffect(() => {
        if(authResponse) {
            console.log('Auth state updated: ', authResponse);
            setIsAuthReady(true);
        }
    }, [authResponse]); 

    const checkPremiumStatusWhenReady = async () => {
        if(!isAuthReady || !authResponse?.params?.access_token || premiumStatus !== null) {
            console.log('Waiting for auth state update...');
            return premiumStatus;
        }
        console.log('Auth is ready. Checking for premium status...');
        try{
            const premium = await checkPremium(authResponse.params.access_token);
            console.log('Premium status is ', premium);
            setPremiumStatus(premium);
            return premium;
        }catch (error){
            console.error('Error checking premium stats: ', error);
            setPremiumStatus(false);
            return false;
        }
    };

    useEffect(() => {
        checkPremiumStatusWhenReady();
    }, [isAuthReady, authResponse]);

    const logout = async () => {
        try{
            console.log('Logging out');
            setAuthResponse(null);
            setIsAuthReady(false);
            setPremiumStatus(null);

            await WebBrowser.openAuthSessionAsync(
                'https://accounts.spotify.com/logout',
                config.redirectUri
            );

            await WebBrowser.coolDownAsync();

            console.log('Logged out of Spotify succesfully.');
            return true;
        }catch (error){
            console.error('Error logging out of Spotify: ', error);
            return false;
        }
    };

    return{
        request,
        response: authResponse,
        promptAsync,
        checkPremiumStatus: checkPremiumStatusWhenReady,
        logout,
        isLoggedin: response?.type === 'success',
        premiumStatus
    };
};
