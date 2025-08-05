import type { FC } from 'hono/jsx'


export const Layout: FC = (props) => {
    return (
        <html>
            <head>
                <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
                <script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.6/dist/htmx.min.js" integrity="sha384-Akqfrbj/HpNVo8k11SXBb6TlBWmXXlYQrCSqEWmyKJe+hDm3Z/B2WVG4smwBkRVm" crossorigin="anonymous"></script>
                <script src="https://unpkg.com/htmx.org/dist/ext/json-enc.js"></script>
            </head>
            <body>{props.children}</body>
        </html>
    )
}

export const Lander: FC = () => {
    return (
        <Layout>
            <div class="w-full h-svh bg-black grid place-items-center text-white">
                <div class="flex flex-col gap-2">
                    <h1 class="text-2xl font-bold">Fish Tracker</h1>
                    <p>Swagger UI available at <a class="text-blue-500 cursor-pointer" href="/api/swagger/ui">UI</a></p>
                    <p>Swagger DOC available at <a class="text-blue-500 cursor-pointer" href="/api/swagger/doc">DOC</a></p>
                    <hr />
                    <p>Endpoint tester <a class="text-blue-500 cursor-pointer" href="/api/debug">debug</a></p>
                </div>
            </div>
        </Layout>
    )
}