import {argv} from "node:process"
import {existsSync} from "node:fs"
import {fileURLToPath} from "node:url"
import {join} from "node:path"
import {mkdir, writeFile} from "node:fs/promises"
import {OpenAPIV3} from "openapi-types"
import sade from "sade"

const config = {
    source: {
      owner: "onlyoffice",
      repo: "docspace-declarations",
      reference: "src",
      paths: [
        {name: "data", path: "asc.data.backup.swagger.json"},
        {name: "files", path: "asc.files.swagger.json"},
        {name: "people", path: "asc.people.swagger.json"},
        {name: "web", path: "asc.web.api.swagger.json"},
      ],
    },
}

main()

/**
 * @returns {void}
 */
function main() {
  sade("./makefile.js")
    .command("build")
    .action(build)
    .parse(argv)
}

/**
 * @returns {Promise<void>}
 */
async function build(){
    const c = config.source

    const rd = rootDir()

    const dd = distDir(rd)
    if (!existsSync(dd)) {
        await mkdir(dd)
    }
    //TODO: console info?
    for (const p of c.paths){
        const u = `https://raw.githubusercontent.com/${c.owner}/${c.repo}/${c.reference}/${p.path}`
        const r = await (await fetch(u)).json()
        patch(r)
        const dp = join(dd, p.path)
        const ds = JSON.stringify(r, null, 2)
        await writeFile(dp, ds)
    }
}

/**
 * @param {OpenAPIV3.Document} o
 * @returns {void}
 */
function patch(o){
    for(const p in o.paths){
        for(const m in o.paths[p]){
            if (o.paths[p][m].description) {
                o.paths[p][m].description = `**Note**: ${o.paths[p][m].description}`
            }
        
            if (o.paths[p][m].summary) {
                if (!o.paths[p][m].description) {
                    o.paths[p][m].description = o.paths[p][m].summary
                } else {
                    o.paths[p][m].description = `${o.paths[p][m].summary}\n\n${o.paths[p][m].description}`
                }
            }
        
            const x = o.paths[p][m]["x-shortName"]
            if (x) {
                o.paths[p][m].summary = x
            }
        }
    }
}

/**
 * @returns {string}
 */
function rootDir() {
    const u = new URL(".", import.meta.url)
    return fileURLToPath(u)
}
  
/**
 * @param {string} d
 * @returns {string}
*/
function distDir(d) {
    return join(d, "dist")
}