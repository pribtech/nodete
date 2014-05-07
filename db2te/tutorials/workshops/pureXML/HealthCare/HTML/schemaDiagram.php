<!--<img width="500" height="500" style="display:block" src="<?php echo $_POST['TUTORIAL_BASE_DIRECTORY'];?>/HTML/clip_image002.jpg" />-->
<?php
$baseDIR = $_GET["BASE_DIR"];
$imageName = "clip_image002.jpg";
?>

<div id="title"><?php echo $imageName;?></div>
<p>
<table cellspacing="0" cellpadding="0">
<tr>
<td width='30'>
<img src="<?php echo $baseDIR;?>/HTML/<?php echo $imageName;?>" border="0" alt="<?php echo $imageName;?>">
</td>
</tr>
</table>
</p>