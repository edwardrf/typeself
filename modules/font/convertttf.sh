font=Courier
pointsize=18
for letter in  "!" "#" "$" "%" "^" "&" "*" "(" ")" "-" "+" "="; do
    convert -font "$font" -pointsize "$pointsize" label:"$letter" images/"$letter".png
    # echo "$letter"
done
for letter in {a..z} {A..Z} {0..9}; do
    convert -font "$font" -pointsize "$pointsize" label:"$letter" images/"$letter".png
    # echo "$letter"
done
convert -font "$font" -pointsize "$pointsize" label:"_" images/"_".png
