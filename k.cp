#include <stdio.h>
#include <conio.h>
int main()
{
    int a[80],n,i;
    int item,pos;
    clrscr();
    print("how many values to be print:")
    scanf("%d",&n);
    printf("enter %d value:\n",n);
    for(i=o;i<n;i++)
    scanf("%d",&a[j]);
printf("input how item to input to insert:");
scanf("d",&item);
printf("enter the position:",&pos);
scanf("%d",&pos);
pos--;
for(i=n;i>=pos;i--)
a[i=1]=a[i];
a[pos]=a[i];
a[pos]=item;
if(pos>n)
printf("wrong input:!");
n++;
printf("\nvalue after insitration:\n");
for(i=0;i<n;i++)
printf("%d\n",a[i]);
getch();
return 0;

}