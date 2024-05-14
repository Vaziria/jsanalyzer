import * as neo4j from "neo4j-driver";
import acorn from 'acorn';
import { json } from "stream/consumers";

export async function OpenNeo(handler: (driver: neo4j.Driver) => Promise<void>) {
    var driver = neo4j.driver(
        'neo4j://localhost',
        neo4j.auth.basic('neo4j', 'password')
      )
      await handler(driver)
      // Close the driver when application exits.
      // This closes all used network connections.
      await driver.close()
}


export async function WriteNode(session: neo4j.Session, node: acorn.Node){
    return await session.executeWrite(async txc => {
        // used transaction will be committed automatically, no need for explicit commit/rollback
        const idnya = "node-"+node.loc.start.line + "-" + node.loc.start.column
        var result = await txc.run(
            `MERGE (${idnya}:Person apoc.convert.fromJsonMap('$jsonData'[,'json-path', 'path-options']) RETURN ${idnya}`,
            {
                jsonData: JSON.stringify(node)
            }
        )
        // at this point it is possible to either return the result or process it and return the
        // result of processing it is also possible to run more statements in the same transaction
        return result.records
      })
}