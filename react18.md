Option 1: Force npm to ignore peer deps on Vercel

Vercel respects environment variables. You can tell npm to ignore peer deps:

Go to your Vercel project dashboard → Settings → Environment Variables.

Add:

NPM_FLAGS=--legacy-peer-deps


In your build settings, prepend your build command:

npm install && npm run build


With NPM_FLAGS=--legacy-peer-deps, Vercel will install the SDK ignoring the React peer dependency.

Option 2: Downgrade React

This is safer if you want full compatibility:

Downgrade React and React DOM in your package.json:

"react": "^18.2.0",
"react-dom": "^18.2.0"


Remove node_modules and package-lock.json:

rm -rf node_modules package-lock.json


Reinstall:

npm install
npm install @100mslive/react-sdk


Commit the changes and push. Vercel will now build correctly.

✅ My recommendation: For a Vercel deployment, Option 2 (React 18) is the cleanest and most stable solution.

If you want, I can rewrite your package.json dependencies so it’s ready to deploy with @100mslive/react-sdk and React 18. Do you want me to do that?