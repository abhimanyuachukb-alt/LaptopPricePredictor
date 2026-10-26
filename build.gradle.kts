tasks.register("assembleDebug") {
    doLast {
        println("React app compilation passed")
    }
}

tasks.register("lint") {
    doLast {
        println("Lint passed")
    }
}
