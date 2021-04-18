#include <stdio.h>

/*
 * This is dumb. The OS I'm running on won't let me chmod u+s a shell script,
 * which is understandable, but it means I need a binary to chmod so
 * I can restart the pi.
 */

int main()
{
    system("/sbin/shutdown -r 0");
    return 0;
}